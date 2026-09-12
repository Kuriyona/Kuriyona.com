# 镜像脚本使用指南

`scripts/image.sh` 统一封装镜像的构建、导出、加载与清理。所有产物只落在 `./output`（gitignored），不会污染仓库根目录。

## 命令总览

```bash
./scripts/image.sh <command> [args]

命令:
  build                构建镜像 (docker build)
  save                 导出镜像 tar 到输出目录 (默认 ./output)
  load [file]          加载 tar 到本机 (默认取 ./output 中的 tar)
  all                  build + save
  clean                清理 ./output 与 ./dist
```

无参数运行时打印帮助。

## 可配置环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `IMAGE_NAME` | `kuriyona-api` | 镜像名 |
| `IMAGE_TAG` | `latest` | 标签 |
| `PLATFORM` | 空 | 目标架构（如 `linux/amd64`），空 = 构建机架构 |
| `OUTPUT_DIR` | `./output` | tar 输出目录（gitignored） |
| `DOCKER` | `docker` | docker 命令，无权限时用 `DOCKER="sudo docker"` |

## 示例

```bash
# 仅构建镜像（不进文件）
./scripts/image.sh build

# 构建并导出 tar
./scripts/image.sh all

# 只导出已存在的镜像
./scripts/image.sh save

# 跨架构构建导出（Mac ARM 产 amd64 镜像给服务器）
PLATFORM=linux/amd64 ./scripts/image.sh all

# 加载 tar 到本机 docker（默认取 ./output 里的 tar）
./scripts/image.sh load

# 加载指定 tar
./scripts/image.sh load /path/to/kuriyona-api.tar

# 清理构建产物
./scripts/image.sh clean

# 无 docker 权限时（用户未加入 docker 组）
DOCKER="sudo docker" ./scripts/image.sh save
```

## package.json 快捷入口

```bash
bun run image:build    # 等同 ./scripts/image.sh build
bun run image:save     # 等同 ./scripts/image.sh save
bun run image:load     # 等同 ./scripts/image.sh load
bun run image:all      # 等同 ./scripts/image.sh all
```

## 产物说明

- tar 文件名：`${IMAGE_NAME}-${IMAGE_TAG}${PLATFORM_SUFFIX}.tar`，如 `kuriyona-api-latest-linux-amd64.tar`。
- `save`/`load` 不修改仓库文件；`clean` 会删除 `./output` 与 `./dist`（均为 gitignored 产物）。
- 服务器加载：`docker load -i <tar>` 后 `docker run`，完整部署流程见 [deployment.md](./deployment.md)。

## 常见问题

**`无法连接 docker daemon`**：当前用户不在 docker 组。执行 `sudo usermod -aG docker $USER` 后重新登录，或用 `DOCKER="sudo docker" ./scripts/image.sh <cmd>`。

**`找不到镜像文件`（load）**：先执行 `./scripts/image.sh save`，或传入 tar 的绝对路径。