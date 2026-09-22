package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"xiuxian-go/internal/config"
	"xiuxian-go/internal/handler"
	"xiuxian-go/internal/service"
)

//go:embed all:dist
var distFS embed.FS

func main() {
	cfg := config.Load()
	aiService := service.NewAIService(cfg)

	// Get embedded static filesystem from dist; fallback to local files if dist is empty
	var staticFS fs.FS
	sub, err := fs.Sub(distFS, "dist")
	if err == nil {
		if f, err := sub.Open("index.html"); err == nil {
			_ = f.Close()
			staticFS = sub
		}
	}
	if staticFS == nil {
		log.Println("[Static] dist 中未检测到 index.html，回退到本地目录提供静态资源 (开发模式)")
		staticFS = os.DirFS(".")
	}

	h := handler.NewHandler(cfg, aiService, staticFS)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	addr := ":" + cfg.Port
	fmt.Println("==================================================")
	fmt.Printf(" 修仙 AI 游戏 Web 服务启动成功！\n")
	fmt.Printf(" 访问地址: http://localhost:%s\n", cfg.Port)
	if cfg.MainAPI.Model != "" {
		fmt.Printf(" 主模型: %s (协议: %s)\n", cfg.MainAPI.Model, cfg.MainAPI.APIType)
	} else {
		fmt.Printf(" 主模型: 未在ENV配置 (可在网页端手动设置)\n")
	}
	if cfg.ExtraAPI.Model != "" {
		fmt.Printf(" 额外模型: %s (协议: %s)\n", cfg.ExtraAPI.Model, cfg.ExtraAPI.APIType)
	} else {
		fmt.Printf(" 额外模型: 默认走主API\n")
	}
	if cfg.Embedding.Enabled {
		fmt.Printf(" 向量接口: 服务端已启用 (模型: %s, 地址: %s)\n", cfg.Embedding.Model, cfg.Embedding.URL)
	} else {
		fmt.Printf(" 向量接口: 服务端未配置 (未设置 EMBEDDING_MODEL/EMBEDDING_URL，自动降级为浏览器本地计算)\n")
	}

	streamDesc := "原生规则 (按客户端请求自适应)"
	if cfg.MainAPI.StreamMode == "stream" {
		streamDesc = "强制流式 (FORCE_STREAM=true)"
	} else if cfg.MainAPI.StreamMode == "sync" {
		streamDesc = "强制非流式 (FORCE_STREAM=false)"
	}
	fmt.Printf(" 流式策略: %s (前端请求统一通过 SSE + 25s 心跳保活，防 Cloudflare 524 超时)\n", streamDesc)
	fmt.Printf(" 响应格式: 兼容 OpenAI Response 格式 (供前端解析)\n")
	fmt.Println("==================================================")

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
