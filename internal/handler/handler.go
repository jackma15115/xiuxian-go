package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"xiuxian-go/internal/config"
	"xiuxian-go/internal/service"
)

type Handler struct {
	cfg       *config.Config
	aiService *service.AIService
	staticFS  fs.FS
}

func NewHandler(cfg *config.Config, aiService *service.AIService, staticFS fs.FS) *Handler {
	return &Handler{
		cfg:       cfg,
		aiService: aiService,
		staticFS:  staticFS,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	// Game Frontend API routes
	mux.HandleFunc("GET /api/config", h.handleConfig)
	mux.HandleFunc("POST /api/chat", h.handleChat)
	mux.HandleFunc("POST /api/extra", h.handleExtra)
	mux.HandleFunc("POST /api/mobile", h.handleMobile)
	mux.HandleFunc("POST /api/embeddings", h.handleEmbeddings)
	mux.HandleFunc("GET /api/models", h.handleModels)

	// OPTIONS preflight
	mux.HandleFunc("OPTIONS /api/", h.handleOptions)

	// Static files for the frontend
	if h.staticFS != nil {
		fileServer := http.FileServer(http.FS(h.staticFS))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodOptions {
				h.handleOptions(w, r)
				return
			}
			// If request starts with /api/, do not serve static
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			fileServer.ServeHTTP(w, r)
		})
	}
}

func (h *Handler) handleOptions(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) handleConfig(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	hasMain := h.cfg.MainAPI.URL != "" && h.cfg.MainAPI.APIKey != ""
	hasExtra := h.cfg.ExtraAPI.URL != "" && h.cfg.ExtraAPI.APIKey != ""
	hasEmbedding := h.cfg.Embedding.Enabled

	embMode := "local"
	if hasEmbedding {
		embMode = "server"
	}

	resp := map[string]interface{}{
		"serverMode":      true,
		"hasMain":         hasMain,
		"hasExtra":        hasExtra,
		"hasEmbedding":    hasEmbedding,
		"embeddingMode":   embMode,
		"mainModel":       h.cfg.MainAPI.Model,
		"extraModel":      h.cfg.ExtraAPI.Model,
		"embeddingModel":  h.cfg.Embedding.Model,
		"mainType":        h.cfg.MainAPI.APIType,
		"extraType":       h.cfg.ExtraAPI.APIType,
		"mainStreamMode":  h.cfg.MainAPI.StreamMode,
		"extraStreamMode": h.cfg.ExtraAPI.StreamMode,
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) handleChat(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	var req service.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body: "+err.Error())
		return
	}

	// 默认走 SSE 传输，附带每 25 秒 keep-alive 心跳，防止 Cloudflare 524 与非流式超时
	isSyncJSON := req.Stream != nil && !*req.Stream && strings.Contains(r.Header.Get("Accept"), "application/json") && !strings.Contains(r.Header.Get("Accept"), "text/event-stream")
	if isSyncJSON {
		resp, err := h.aiService.Chat(r.Context(), &req, false)
		if err != nil {
			log.Printf("[Chat API Error]: %v", err)
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	h.streamChatResponse(w, r, &req, false)
}

func (h *Handler) handleExtra(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	var req service.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body: "+err.Error())
		return
	}

	isSyncJSON := req.Stream != nil && !*req.Stream && strings.Contains(r.Header.Get("Accept"), "application/json") && !strings.Contains(r.Header.Get("Accept"), "text/event-stream")
	if isSyncJSON {
		resp, err := h.aiService.Chat(r.Context(), &req, true)
		if err != nil {
			log.Printf("[Extra API Error]: %v", err)
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	h.streamChatResponse(w, r, &req, true)
}

func (h *Handler) handleMobile(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	var req service.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body: "+err.Error())
		return
	}

	isSyncJSON := req.Stream != nil && !*req.Stream && strings.Contains(r.Header.Get("Accept"), "application/json") && !strings.Contains(r.Header.Get("Accept"), "text/event-stream")
	if isSyncJSON {
		resp, err := h.aiService.Chat(r.Context(), &req, true)
		if err != nil {
			log.Printf("[Mobile API Error]: %v", err)
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	h.streamChatResponse(w, r, &req, true)
}

func (h *Handler) streamChatResponse(w http.ResponseWriter, r *http.Request, req *service.ChatRequest, isExtra bool) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "Streaming unsupported by web server")
		return
	}

	// 1. 发送 SSE 响应头
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	var mu sync.Mutex
	writeRaw := func(msg string) error {
		mu.Lock()
		defer mu.Unlock()
		_, err := fmt.Fprint(w, msg)
		if err == nil {
			flusher.Flush()
		}
		return err
	}

	// 2. 立即发送一次 keep-alive 注释行，确保前端和网关（如 Cloudflare）立即建立传输流
	_ = writeRaw(": keep-alive\n\n")

	// 3. 启动心跳定时器（每 25 秒触发一次，严格低于 30 秒，防止 Cloudflare 524 等网关超时）
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	doneCh := make(chan struct{})
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-doneCh:
				return
			case <-ticker.C:
				if err := writeRaw(": keep-alive\n\n"); err != nil {
					cancel()
					return
				}
			}
		}
	}()
	defer close(doneCh)

	respID := fmt.Sprintf("chatcmpl-%d", time.Now().UnixNano())
	created := time.Now().Unix()
	model := req.Model
	if model == "" {
		if isExtra {
			model = h.cfg.ExtraAPI.Model
		} else {
			model = h.cfg.MainAPI.Model
		}
	}

	// 标记为 stream 供 aiService 进行流式适配
	streamTrue := true
	req.Stream = &streamTrue

	_, err := h.aiService.ChatStream(ctx, req, isExtra, func(chunk string) error {
		c := service.ChatCompletionChunk{
			ID:      respID,
			Object:  "chat.completion.chunk",
			Created: created,
			Model:   model,
			Choices: []service.ChunkChoice{
				{
					Index: 0,
					Delta: service.ChatMessage{
						Role:    "assistant",
						Content: chunk,
					},
				},
			},
		}
		data, _ := json.Marshal(c)
		return writeRaw(fmt.Sprintf("data: %s\n\n", string(data)))
	})

	if err != nil {
		log.Printf("[Stream Error]: %v", err)
		errObj := map[string]interface{}{
			"error": map[string]string{
				"message": err.Error(),
				"type":    "stream_error",
			},
		}
		errBytes, _ := json.Marshal(errObj)
		_ = writeRaw(fmt.Sprintf("data: %s\n\n", string(errBytes)))
		return
	}

	stop := "stop"
	finalChunk := service.ChatCompletionChunk{
		ID:      respID,
		Object:  "chat.completion.chunk",
		Created: created,
		Model:   model,
		Choices: []service.ChunkChoice{
			{
				Index:        0,
				Delta:        service.ChatMessage{},
				FinishReason: &stop,
			},
		},
	}
	finalBytes, _ := json.Marshal(finalChunk)
	_ = writeRaw(fmt.Sprintf("data: %s\n\n", string(finalBytes)))
	_ = writeRaw("data: [DONE]\n\n")
}

func (h *Handler) handleEmbeddings(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	if !h.cfg.Embedding.Enabled {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"error":    "server embedding not configured",
			"fallback": "local",
		})
		return
	}

	var req service.EmbeddingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body: "+err.Error())
		return
	}

	resp, err := h.aiService.Embedding(r.Context(), &req)
	if err != nil {
		log.Printf("[Embedding API Error]: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) handleModels(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)
	isExtra := r.URL.Query().Get("type") == "extra"
	modelsResp, err := h.aiService.FetchModels(r.Context(), isExtra)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	var names []string
	for _, m := range modelsResp.Data {
		names = append(names, m.ID)
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"models": names,
	})
}

func setCommonHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"error": map[string]interface{}{
			"message": message,
			"type":    "api_error",
		},
	})
}
