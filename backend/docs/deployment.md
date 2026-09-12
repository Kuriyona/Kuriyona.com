# 生产环境 Docker 部署

## 架构说明

- 镜像采用**多阶段构建**：构建阶段用 `oven/bun:1.4.2` 在容器内完成依赖安装与打包，运行阶段用 `oven/bun:1.4.2-slim` 只保留产物。
- 产物 `dist/backend.js` 与 `dist/drizzle/`（迁移 SQL）一起进入镜像，服务**启动时自动执行数据库迁移**。
- 数据库使用**服务器上已有的 MySQL**，不在容器内运行。
- 应用以非 root 用户 `bun` 运行。
- 镜像构建/导出/加载统一通过 `scripts/image.sh` 完成（用法见 [docs/image.md](./image.md)）。

## 环境变量

运行时通过 `--env-file` 或 `-e` 注入，`.env` **不进入镜像**。

必需变量（缺失时应用启动即退出）：

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | MySQL 连接串（`mysql://...:3306/...`），指向服务器已有数据库 |
| `JWT_SECRET` | JWT 签名密钥 |
| `AUTH_KEY` | 管理接口鉴权密钥 |
| `ENDPOINT` | Cloudflare R2 端点 |
| `ACCESS_KEY_ID` | R2 Access Key |
| `SECRET_ACCESS_KEY` | R2 Secret Key |
| `BUCKET_NAME` | R2 Bucket 名 |
| `TURNSTILE_SECRET_KEY` | Turnstile 密钥 |

可选变量：

| 变量 | 说明 | 默认 |
|---|---|---|
| `PORT` | 服务端口 | `62802` |
| `TURNSTILE_DEV_SECRET_KEY` | 开发用 Turnstile 密钥（存在时优先） | 无 |
| `WEATHER_API_KEY` | 天气接口密钥 | 无 |
| `GITHUB_API_TOKEN` | GitHub 活动接口令牌 | 无 |
| `STEAM_API_KEY` | Steam 接口密钥 | 无 |

## 一、准备服务器数据库

服务器上的 MySQL 需先存在目标数据库与用户。若使用独立角色：

```bash
sudo mysql <<'SQL'
CREATE DATABASE `kuriyona-api`;
CREATE USER 'kuriyona'@'%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON `kuriyona-api`.* TO 'kuriyona'@'%';
FLUSH PRIVILEGES;
SQL
```

> 服务器与 Docker 同机时：容器内的 `localhost` 是容器自己，**不是宿主机**。`DATABASE_URL` 需用宿主机内网 IP（如 `172.17.0.1` 或服务器内网地址），或运行容器时加 `--network host`（推荐，见下）。

## 二、构建并导出镜像（在开发机执行）

```bash
# 构建镜像
./scripts/image.sh build

# 构建并导出 tar 到 ./output（若服务器为 amd64、开发机是 Mac ARM，加 PLATFORM=linux/amd64）
./scripts/image.sh all
# 或仅导出已构建的镜像
./scripts/image.sh save
```

产物默认在 `./output/kuriyona-api-latest.tar`。

## 三、把镜像传到服务器

```bash
scp output/kuriyona-api-latest.tar user@SERVER_IP:/opt/kuriyona/
```

（也可通过服务器面板上传。）

## 四、在服务器加载并运行

```bash
# 加载镜像
docker load -i /opt/kuriyona/kuriyona-api-latest.tar

# 准备 .env.production（cp .env.example .env.production 后填写 8 项必需变量）
DATABASE_URL=mysql://kuriyona:YOUR_STRONG_PASSWORD@172.17.0.1:3306/kuriyona-api
JWT_SECRET=...
AUTH_KEY=...
ENDPOINT=...
ACCESS_KEY_ID=...
SECRET_ACCESS_KEY=...
BUCKET_NAME=...
TURNSTILE_SECRET_KEY=...

# 运行（--network host 让容器直接共享宿主机网络，localhost 即宿主机）
docker run -d --name kuriyona-api \
  --restart unless-stopped \
  --network host \
  --env-file /opt/kuriyona/.env.production \
  kuriyona-api:latest
```

验证：

```bash
curl http://localhost:62802/
# 期望返回: This API site of Kuriyona.com
```

查看日志：

```bash
docker logs -f kuriyona-api
```

## 五、升级部署

1. 开发机重新构建并导出：
   ```bash
   ./scripts/image.sh all
   ```
2. 传输新 tar 到服务器后重建容器：
   ```bash
   docker stop kuriyona-api && docker rm kuriyona-api
   docker load -i /opt/kuriyona/kuriyona-api-latest.tar
   docker run -d --name kuriyona-api \
     --restart unless-stopped \
     --network host \
     --env-file /opt/kuriyona/.env.production \
     kuriyona-api:latest
   ```

## 六、数据库迁移

- 服务启动时自动执行 `migrate()` 应用 `dist/drizzle/` 下的迁移，无需手动操作。
- 迁移幂等：已应用过的迁移（`__drizzle_migrations` 表记录）不会重复执行。
- **生产环境请保持单副本运行**，避免多副本并发执行迁移产生竞态。
- 数据库不可用时应用会启动失败并退出，容器按 `restart: unless-stopped` 自动重试，数据库就绪后即可正常启动。

## 七、常用命令

```bash
docker logs -f kuriyona-api   # 查看日志
docker ps                     # 查看容器状态
docker restart kuriyona-api   # 重启
docker stop kuriyona-api      # 停止
docker rm kuriyona-api        # 删除容器
```