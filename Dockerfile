# ==========================================
# 阶段 1: 前端静态资源构建 (Webpack)
# ==========================================
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder

WORKDIR /build

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制前端资源与源码进行 Webpack 打包
COPY . .
RUN npm run build

# ==========================================
# 阶段 2: Go 后端独立二进制编译 (含嵌入静态文件)
# ==========================================
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS backend-builder

ARG TARGETOS
ARG TARGETARCH

WORKDIR /build

# 下载 Go 依赖
COPY go.mod ./
RUN go mod download

# 复制 Go 源码以及从阶段 1 生成的 dist 目录
COPY main.go ./
COPY internal/ ./internal/
COPY --from=frontend-builder /build/dist ./dist

# 跨平台静态编译 Go 可执行文件
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -ldflags="-s -w" -o xiuxian .

# ==========================================
# 阶段 3: 极简纯净运行时镜像
# ==========================================
FROM alpine:3.20

# 安装根证书与时区支持
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# 从构建器阶段复制编译结果与配置示例
COPY --from=backend-builder /build/xiuxian /app/xiuxian
COPY .env.example /app/.env.example

# 暴露端口
EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["/app/xiuxian"]
