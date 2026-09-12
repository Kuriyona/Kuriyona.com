# 多设备本地开发

本项目使用 MySQL,在 Windows PC(WSL2)与 MacBook 上各跑一个本地实例。
两台设备的数据库**数据各自独立**,通过 Git 中的 drizzle 迁移文件保持 schema 同步。

## 1. 环境准备

需要 [Bun](https://bun.sh)（开发运行）与 Docker（仅构建/部署镜像时需要）。

```bash
pnpm install       # 安装依赖
cp .env.example .env   # 生成环境变量文件并填写
```

## 2. 数据库引擎

- 驱动:`drizzle-orm/mysql2` + `mysql2`
- 连接串:`DATABASE_URL`(见 `.env.example`)
- 数据库名:`kuriyona-api-dev`

## 3. 各平台安装与建库

### Windows PC(WSL2)

```bash
sudo apt update && sudo apt install -y mysql-server
sudo service mysql start
sudo mysql -e "CREATE DATABASE \`kuriyona-api-dev\`;"
sudo mysql -e "CREATE USER 'Kuriyona'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON \`kuriyona-api-dev\`.* TO 'Kuriyona'@'localhost'; FLUSH PRIVILEGES;"
```

在 `.env` 设置:

```
DATABASE_URL=mysql://Kuriyona:YOUR_PASSWORD@localhost:3306/kuriyona-api-dev
```

### MacBook

```bash
brew install mysql
brew services start mysql
mysql -uroot -e "CREATE DATABASE \`kuriyona-api-dev\`;"
```

在 `.env` 设置:

```
DATABASE_URL=mysql://root@localhost:3306/kuriyona-api-dev
```

> 每台设备的 `.env` 各自独立,由 Git 忽略,不会互相覆盖。

## 4. 初始化表结构

首次(或 schema 变更后)运行一次:

```bash
pnpm exec drizzle-kit push
```

之后通过迁移文件管理:

```bash
bun run orm-generate   # 改 schema 后生成迁移(drizzle-kit generate)
# 提交生成的 drizzle/ 目录
pnpm exec drizzle-kit migrate   # 两端拉代码后应用迁移
```

## 5. 开发运行

```bash
bun run dev
```

服务启动时会自动执行 `migrate()` 应用 `./drizzle` 下的迁移。

## 6. Schema 同步纪律

两台设备数据不同步,仅 schema 通过 Git 同步。改表时**必须**:

1. 修改 `src/db/schema.ts`
2. 运行 `bun run orm-generate` 生成迁移
3. 提交 `drizzle/` 目录
4. 另一台设备 `git pull` 后运行 `pnpm exec drizzle-kit migrate`

不要在未生成迁移的情况下直接改表结构。

## 7. 迁移测试数据(可选)

如需跨设备迁移测试数据:

```bash
mysqldump -u Kuriyona -p kuriyona-api-dev > dump.sql
# 在目标设备
mysql -u Kuriyona -p kuriyona-api-dev < dump.sql
```
