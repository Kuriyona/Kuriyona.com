#!/usr/bin/env bash
#
# 镜像构建 / 导出 / 加载脚本
#
# 用法:
#   ./scripts/image.sh <command> [args]
#
# 命令:
#   build                构建镜像 (docker build)
#   save                 导出镜像 tar 到输出目录 (默认 ./output)
#   load [file]          加载 tar 到本机 (默认取输出目录中的 tar)
#   all                  build + save
#   clean                清理 ./output 与 ./dist
#
# 可用环境变量(覆盖默认值):
#   IMAGE_NAME   镜像名          (默认: kuriyona-api)
#   IMAGE_TAG    标签            (默认: latest)
#   PLATFORM     目标架构        (默认: 空 = 构建机架构, 如 linux/amd64)
#   OUTPUT_DIR   tar 输出目录    (默认: ./output)
#   DOCKER       docker 命令     (默认: docker; 无权限时用 DOCKER="sudo docker")
#
# 示例:
#   ./scripts/image.sh build
#   DOCKER="sudo docker" ./scripts/image.sh save
#   PLATFORM=linux/amd64 ./scripts/image.sh save
#   ./scripts/image.sh load /path/to/kuriyona-api.tar
#
set -euo pipefail

# 切换到仓库根目录
cd "$(dirname "$0")/.."

IMAGE_NAME="${IMAGE_NAME:-kuriyona-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORM="${PLATFORM:-}"
OUTPUT_DIR="${OUTPUT_DIR:-$(pwd)/output}"
DOCKER="${DOCKER:-docker}"

# 平台后缀: linux/amd64 -> -linux-amd64
PLATFORM_SUFFIX=""
if [ -n "$PLATFORM" ]; then
  PLATFORM_SUFFIX="-${PLATFORM//\//-}"
fi

IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
OUTPUT_FILE="${OUTPUT_DIR}/${IMAGE_NAME}-${IMAGE_TAG}${PLATFORM_SUFFIX}.tar"

usage() {
  sed -n '2,20p' "$0"
}

require_docker() {
  if ! command -v "${DOCKER%% *}" >/dev/null 2>&1; then
    echo "[image] 未找到 docker 命令: ${DOCKER}" >&2
    echo "[image] 请安装 docker, 或设置 DOCKER 环境变量 (如 DOCKER=\"sudo docker\")" >&2
    exit 1
  fi
  if ! $DOCKER info >/dev/null 2>&1; then
    echo "[image] 无法连接 docker daemon, 请检查权限 (无权限时用 DOCKER=\"sudo docker\")" >&2
    exit 1
  fi
}

cmd_build() {
  require_docker
  echo "[image] 构建镜像 ${IMAGE_REF} ..."
  if [ -n "$PLATFORM" ]; then
    $DOCKER build --platform "$PLATFORM" -t "$IMAGE_REF" .
  else
    $DOCKER build -t "$IMAGE_REF" .
  fi
  echo "[image] 构建完成: ${IMAGE_REF}"
}

cmd_save() {
  require_docker
  mkdir -p "$OUTPUT_DIR"
  echo "[image] 导出 ${IMAGE_REF} -> ${OUTPUT_FILE}"
  $DOCKER save -o "$OUTPUT_FILE" "$IMAGE_REF"
  echo "[image] 已导出: ${OUTPUT_FILE} ($(du -h "$OUTPUT_FILE" | cut -f1))"
}

cmd_load() {
  require_docker
  local file="${1:-}"
  if [ -z "$file" ]; then
    file="$OUTPUT_FILE"
  fi
  if [ ! -f "$file" ]; then
    echo "[image] 找不到镜像文件: $file" >&2
    echo "[image] 请传入文件路径, 或先执行 ./scripts/image.sh save" >&2
    exit 1
  fi
  echo "[image] 加载镜像文件: $file"
  $DOCKER load -i "$file"
  echo "[image] 加载完成"
}

cmd_clean() {
  echo "[image] 清理 ./output 与 ./dist ..."
  rm -rf ./output ./dist
  echo "[image] 清理完成"
}

case "${1:-}" in
  build) cmd_build ;;
  save) cmd_save ;;
  load) shift; cmd_load "${1:-}" ;;
  all) cmd_build && cmd_save ;;
  clean) cmd_clean ;;
  *) usage; exit 1 ;;
esac