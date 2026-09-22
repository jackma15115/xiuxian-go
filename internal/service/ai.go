package service

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"xiuxian-go/internal/config"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model       string        `json:"model,omitempty"`
	Messages    []ChatMessage `json:"messages"`
	Temperature *float64      `json:"temperature,omitempty"`
	MaxTokens   *int          `json:"max_tokens,omitempty"`
	TopP        *float64      `json:"top_p,omitempty"`
	Stream      *bool         `json:"stream,omitempty"`
}

type ChatUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type ChatChoice struct {
	Index        int         `json:"index"`
	Message      ChatMessage `json:"message"`
	FinishReason string      `json:"finish_reason,omitempty"`
}

// ChatResponse implements standard OpenAI ChatCompletion response structure
type ChatResponse struct {
	ID      string       `json:"id"`
	Object  string       `json:"object"`
	Created int64        `json:"created"`
	Model   string       `json:"model"`
	Choices []ChatChoice `json:"choices"`
	Usage   *ChatUsage   `json:"usage,omitempty"`
	Content string       `json:"content"` // Top-level convenience field
}

// ChatCompletionChunk for SSE streaming
type ChatCompletionChunk struct {
	ID      string        `json:"id"`
	Object  string        `json:"object"` // "chat.completion.chunk"
	Created int64         `json:"created"`
	Model   string        `json:"model"`
	Choices []ChunkChoice `json:"choices"`
}

type ChunkChoice struct {
	Index        int         `json:"index"`
	Delta        ChatMessage `json:"delta"`
	FinishReason *string     `json:"finish_reason"`
}

// Responses API Request (/v1/responses)
type ResponsesRequest struct {
	Model           string      `json:"model,omitempty"`
	Input           interface{} `json:"input"` // string or []ChatMessage
	Instructions    string      `json:"instructions,omitempty"`
	Temperature     *float64    `json:"temperature,omitempty"`
	MaxOutputTokens *int        `json:"max_output_tokens,omitempty"`
	Stream          *bool       `json:"stream,omitempty"`
}

type ResponsesContentPart struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type ResponsesOutputItem struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"` // "message"
	Status  string                 `json:"status"`
	Role    string                 `json:"role"`
	Content []ResponsesContentPart `json:"content"`
}

// ResponsesResponse implements standard OpenAI Responses API structure
type ResponsesResponse struct {
	ID         string                `json:"id"`
	Object     string                `json:"object"` // "response"
	CreatedAt  int64                 `json:"created_at"`
	Model      string                `json:"model"`
	Status     string                `json:"status"` // "completed"
	Output     []ResponsesOutputItem `json:"output"`
	OutputText string                `json:"output_text"`
	Usage      *ChatUsage            `json:"usage,omitempty"`
}

type EmbeddingRequest struct {
	Input interface{} `json:"input"` // string or []string
	Model string      `json:"model,omitempty"`
}

type EmbeddingItem struct {
	Index     int       `json:"index"`
	Embedding []float64 `json:"embedding"`
}

type EmbeddingResponse struct {
	Object string          `json:"object"` // "list"
	Data   []EmbeddingItem `json:"data"`
	Model  string          `json:"model,omitempty"`
}

type ModelItem struct {
	ID      string `json:"id"`
	Object  string `json:"object"` // "model"
	Created int64  `json:"created"`
	OwnedBy string `json:"owned_by"`
}

type ModelListResponse struct {
	Object string      `json:"object"` // "list"
	Data   []ModelItem `json:"data"`
}

type AIService struct {
	cfg    *config.Config
	client *http.Client
}

func NewAIService(cfg *config.Config) *AIService {
	return &AIService{
		cfg: cfg,
		client: &http.Client{
			Timeout: 300 * time.Second,
		},
	}
}

func generateID(prefix string) string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return prefix + hex.EncodeToString(b)
}

// Determine if upstream request should use streaming
func (s *AIService) shouldStreamUpstream(apiCfg config.APIConfig, clientStream bool) bool {
	switch apiCfg.StreamMode {
	case "stream":
		return true // 强制走流式
	case "sync":
		return false // 强制走非流式
	default:
		return clientStream // 没配置按原生规则走
	}
}

// Chat handles non-streaming chat requests.
func (s *AIService) Chat(ctx context.Context, req *ChatRequest, isExtra bool) (*ChatResponse, error) {
	var apiCfg config.APIConfig
	if isExtra {
		apiCfg = s.cfg.ExtraAPI
	} else {
		apiCfg = s.cfg.MainAPI
	}

	if apiCfg.URL == "" || apiCfg.APIKey == "" {
		return nil, errors.New("AI API未配置，请在环境变量或.env中设置 URL 与 APIKEY")
	}

	model := req.Model
	if model == "" {
		model = apiCfg.Model
	}
	if model == "" {
		model = "gpt-3.5-turbo"
	}

	clientStream := req.Stream != nil && *req.Stream
	upstreamStream := s.shouldStreamUpstream(apiCfg, clientStream)

	if upstreamStream {
		// Upstream is streaming: read stream, accumulate chunks, and return full ChatResponse
		var fullText strings.Builder
		respID := generateID("chatcmpl-")
		created := time.Now().Unix()

		err := s.executeStream(ctx, apiCfg, model, req, func(chunk string) error {
			fullText.WriteString(chunk)
			return nil
		})
		if err != nil {
			return nil, err
		}

		finalContent := fullText.String()
		return &ChatResponse{
			ID:      respID,
			Object:  "chat.completion",
			Created: created,
			Model:   model,
			Choices: []ChatChoice{{
				Index: 0,
				Message: ChatMessage{
					Role:    "assistant",
					Content: finalContent,
				},
				FinishReason: "stop",
			}},
			Usage: &ChatUsage{
				PromptTokens:     estimateTokens(req.Messages),
				CompletionTokens: estimateTokenCount(finalContent),
				TotalTokens:      estimateTokens(req.Messages) + estimateTokenCount(finalContent),
			},
			Content: finalContent,
		}, nil
	}

	// Upstream is non-streaming
	if apiCfg.APIType == "gemini" {
		return s.chatGeminiSync(ctx, apiCfg, model, req)
	}
	return s.chatOpenAISync(ctx, apiCfg, model, req)
}

// ChatStream handles streaming requests, invoking onChunk for each incoming token.
func (s *AIService) ChatStream(ctx context.Context, req *ChatRequest, isExtra bool, onChunk func(chunk string) error) (*ChatResponse, error) {
	var apiCfg config.APIConfig
	if isExtra {
		apiCfg = s.cfg.ExtraAPI
	} else {
		apiCfg = s.cfg.MainAPI
	}

	if apiCfg.URL == "" || apiCfg.APIKey == "" {
		return nil, errors.New("AI API未配置，请在环境变量或.env中设置 URL 与 APIKEY")
	}

	model := req.Model
	if model == "" {
		model = apiCfg.Model
	}
	if model == "" {
		model = "gpt-3.5-turbo"
	}

	upstreamStream := s.shouldStreamUpstream(apiCfg, true)

	if upstreamStream {
		var fullText strings.Builder
		respID := generateID("chatcmpl-")
		created := time.Now().Unix()

		err := s.executeStream(ctx, apiCfg, model, req, func(chunk string) error {
			fullText.WriteString(chunk)
			return onChunk(chunk)
		})
		if err != nil {
			return nil, err
		}

		finalContent := fullText.String()
		return &ChatResponse{
			ID:      respID,
			Object:  "chat.completion",
			Created: created,
			Model:   model,
			Choices: []ChatChoice{{
				Index: 0,
				Message: ChatMessage{
					Role:    "assistant",
					Content: finalContent,
				},
				FinishReason: "stop",
			}},
			Content: finalContent,
		}, nil
	}

	// Forced non-streaming upstream: fetch full response and send once to onChunk
	resp, err := s.Chat(ctx, req, isExtra)
	if err != nil {
		return nil, err
	}
	if err := onChunk(resp.Content); err != nil {
		return nil, err
	}
	return resp, nil
}

// executeStream calls upstream in streaming mode and feeds tokens to onChunk
func (s *AIService) executeStream(ctx context.Context, cfg config.APIConfig, model string, req *ChatRequest, onChunk func(string) error) error {
	if cfg.APIType == "gemini" {
		return s.streamGemini(ctx, cfg, model, req, onChunk)
	}
	return s.streamOpenAI(ctx, cfg, model, req, onChunk)
}

func (s *AIService) streamOpenAI(ctx context.Context, cfg config.APIConfig, model string, req *ChatRequest, onChunk func(string) error) error {
	url := cfg.URL
	if !strings.HasSuffix(url, "/chat/completions") {
		url = strings.TrimRight(url, "/") + "/chat/completions"
	}

	temp := 0.8
	if req.Temperature != nil {
		temp = *req.Temperature
	}
	maxTokens := 16384
	if req.MaxTokens != nil && *req.MaxTokens > 0 {
		maxTokens = *req.MaxTokens
	}

	bodyMap := map[string]interface{}{
		"model":       model,
		"messages":    req.Messages,
		"temperature": temp,
		"max_tokens":  maxTokens,
		"stream":      true,
	}
	if req.TopP != nil {
		bodyMap["top_p"] = *req.TopP
	}

	reqBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return fmt.Errorf("marshal request failed: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return fmt.Errorf("create request failed: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	httpReq.Header.Set("Accept", "text/event-stream")

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("request AI upstream stream failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upstream API stream error HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	scanner := bufio.NewScanner(resp.Body)
	// Buffer large lines if needed
	buf := make([]byte, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		line := scanner.Text()
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, ":") {
			continue
		}
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		dataStr := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if dataStr == "" || dataStr == "[DONE]" {
			continue
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
				Text string `json:"text"`
			} `json:"choices"`
			// Compatibility with direct text/response deltas
			Response string `json:"response"`
		}
		if err := json.Unmarshal([]byte(dataStr), &chunk); err != nil {
			continue
		}

		var token string
		if len(chunk.Choices) > 0 {
			token = chunk.Choices[0].Delta.Content
			if token == "" {
				token = chunk.Choices[0].Text
			}
		} else if chunk.Response != "" {
			token = chunk.Response
		}

		if token != "" {
			if err := onChunk(token); err != nil {
				return err
			}
		}
	}

	return scanner.Err()
}

func (s *AIService) streamGemini(ctx context.Context, cfg config.APIConfig, model string, req *ChatRequest, onChunk func(string) error) error {
	baseURL := strings.TrimRight(cfg.URL, "/")
	url := fmt.Sprintf("%s/models/%s:streamGenerateContent?alt=sse&key=%s", baseURL, model, cfg.APIKey)

	var systemText string
	var contents []map[string]interface{}
	for _, m := range req.Messages {
		if m.Role == "system" {
			systemText = m.Content
			continue
		}
		geminiRole := "user"
		if m.Role == "assistant" {
			geminiRole = "model"
		}
		contents = append(contents, map[string]interface{}{
			"role": geminiRole,
			"parts": []map[string]interface{}{
				{"text": m.Content},
			},
		})
	}

	bodyMap := map[string]interface{}{
		"contents": contents,
		"generationConfig": map[string]interface{}{
			"temperature":     0.8,
			"maxOutputTokens": 8192,
		},
	}
	if systemText != "" {
		bodyMap["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": systemText},
			},
		}
	}

	reqBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("gemini stream error HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		dataStr := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if dataStr == "" || dataStr == "[DONE]" {
			continue
		}

		var geminiResp struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}
		if err := json.Unmarshal([]byte(dataStr), &geminiResp); err != nil {
			continue
		}

		for _, cand := range geminiResp.Candidates {
			for _, p := range cand.Content.Parts {
				if p.Text != "" {
					if err := onChunk(p.Text); err != nil {
						return err
					}
				}
			}
		}
	}

	return scanner.Err()
}

func (s *AIService) chatOpenAISync(ctx context.Context, cfg config.APIConfig, model string, req *ChatRequest) (*ChatResponse, error) {
	url := cfg.URL
	if !strings.HasSuffix(url, "/chat/completions") {
		url = strings.TrimRight(url, "/") + "/chat/completions"
	}

	temp := 0.8
	if req.Temperature != nil {
		temp = *req.Temperature
	}
	maxTokens := 16384
	if req.MaxTokens != nil && *req.MaxTokens > 0 {
		maxTokens = *req.MaxTokens
	}

	bodyMap := map[string]interface{}{
		"model":       model,
		"messages":    req.Messages,
		"temperature": temp,
		"max_tokens":  maxTokens,
		"stream":      false,
	}
	if req.TopP != nil {
		bodyMap["top_p"] = *req.TopP
	}

	reqBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return nil, fmt.Errorf("marshal request failed: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("create request failed: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request AI upstream failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read upstream response failed: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("upstream API error HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	// 兼容解析多种标准与非标准上游响应
	var rawMap map[string]interface{}
	if err := json.Unmarshal(respBody, &rawMap); err != nil {
		return nil, fmt.Errorf("unmarshal upstream response failed: %w", err)
	}

	respID := generateID("chatcmpl-")
	if idVal, ok := rawMap["id"].(string); ok && idVal != "" {
		respID = idVal
	}

	created := time.Now().Unix()
	if cVal, ok := rawMap["created"].(float64); ok && cVal > 0 {
		created = int64(cVal)
	}

	retModel := model
	if mVal, ok := rawMap["model"].(string); ok && mVal != "" {
		retModel = mVal
	}

	content := extractContentFromMap(rawMap)

	var usage *ChatUsage
	if uMap, ok := rawMap["usage"].(map[string]interface{}); ok {
		usage = &ChatUsage{
			PromptTokens:     int(getFloat(uMap, "prompt_tokens")),
			CompletionTokens: int(getFloat(uMap, "completion_tokens")),
			TotalTokens:      int(getFloat(uMap, "total_tokens")),
		}
	} else {
		usage = &ChatUsage{
			PromptTokens:     estimateTokens(req.Messages),
			CompletionTokens: estimateTokenCount(content),
			TotalTokens:      estimateTokens(req.Messages) + estimateTokenCount(content),
		}
	}

	choices := []ChatChoice{
		{
			Index: 0,
			Message: ChatMessage{
				Role:    "assistant",
				Content: content,
			},
			FinishReason: "stop",
		},
	}

	return &ChatResponse{
		ID:      respID,
		Object:  "chat.completion",
		Created: created,
		Model:   retModel,
		Choices: choices,
		Usage:   usage,
		Content: content,
	}, nil
}

func (s *AIService) chatGeminiSync(ctx context.Context, cfg config.APIConfig, model string, req *ChatRequest) (*ChatResponse, error) {
	baseURL := strings.TrimRight(cfg.URL, "/")
	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", baseURL, model, cfg.APIKey)

	var systemText string
	var contents []map[string]interface{}
	for _, m := range req.Messages {
		if m.Role == "system" {
			systemText = m.Content
			continue
		}
		geminiRole := "user"
		if m.Role == "assistant" {
			geminiRole = "model"
		}
		contents = append(contents, map[string]interface{}{
			"role": geminiRole,
			"parts": []map[string]interface{}{
				{"text": m.Content},
			},
		})
	}

	bodyMap := map[string]interface{}{
		"contents": contents,
		"generationConfig": map[string]interface{}{
			"temperature":     0.8,
			"maxOutputTokens": 8192,
		},
	}
	if systemText != "" {
		bodyMap["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": systemText},
			},
		}
	}

	reqBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return nil, fmt.Errorf("marshal gemini request failed: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("create gemini request failed: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request Gemini failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read Gemini response failed: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("gemini API error HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
			FinishReason string `json:"finishReason"`
		} `json:"candidates"`
		UsageMetadata struct {
			PromptTokenCount     int `json:"promptTokenCount"`
			CandidatesTokenCount int `json:"candidatesTokenCount"`
			TotalTokenCount      int `json:"totalTokenCount"`
		} `json:"usageMetadata"`
	}

	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return nil, fmt.Errorf("unmarshal Gemini response failed: %w", err)
	}

	content := ""
	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		content = geminiResp.Candidates[0].Content.Parts[0].Text
	} else {
		content = "请求被模型阻止，可能触发了安全设置。"
	}

	respID := generateID("chatcmpl-")
	created := time.Now().Unix()

	return &ChatResponse{
		ID:      respID,
		Object:  "chat.completion",
		Created: created,
		Model:   model,
		Choices: []ChatChoice{{
			Index: 0,
			Message: ChatMessage{
				Role:    "assistant",
				Content: content,
			},
			FinishReason: "stop",
		}},
		Usage: &ChatUsage{
			PromptTokens:     geminiResp.UsageMetadata.PromptTokenCount,
			CompletionTokens: geminiResp.UsageMetadata.CandidatesTokenCount,
			TotalTokens:      geminiResp.UsageMetadata.TotalTokenCount,
		},
		Content: content,
	}, nil
}

// ResponsesAPI handles OpenAI Responses API (/v1/responses) requests
func (s *AIService) ResponsesAPI(ctx context.Context, req *ResponsesRequest, isExtra bool) (*ResponsesResponse, error) {
	chatReq := s.convertResponsesRequestToChat(req)
	chatResp, err := s.Chat(ctx, chatReq, isExtra)
	if err != nil {
		return nil, err
	}

	respID := generateID("resp_")
	return &ResponsesResponse{
		ID:        respID,
		Object:    "response",
		CreatedAt: chatResp.Created,
		Model:     chatResp.Model,
		Status:    "completed",
		Output: []ResponsesOutputItem{
			{
				ID:     generateID("msg_"),
				Type:   "message",
				Status: "completed",
				Role:   "assistant",
				Content: []ResponsesContentPart{
					{
						Type: "text",
						Text: chatResp.Content,
					},
				},
			},
		},
		OutputText: chatResp.Content,
		Usage:      chatResp.Usage,
	}, nil
}

func (s *AIService) convertResponsesRequestToChat(req *ResponsesRequest) *ChatRequest {
	var messages []ChatMessage
	if req.Instructions != "" {
		messages = append(messages, ChatMessage{
			Role:    "system",
			Content: req.Instructions,
		})
	}

	if strInput, ok := req.Input.(string); ok {
		messages = append(messages, ChatMessage{
			Role:    "user",
			Content: strInput,
		})
	} else if rawSlice, ok := req.Input.([]interface{}); ok {
		for _, item := range rawSlice {
			if m, ok := item.(map[string]interface{}); ok {
				role := "user"
				if r, ok := m["role"].(string); ok && r != "" {
					role = r
				}
				content := ""
				if c, ok := m["content"].(string); ok {
					content = c
				}
				messages = append(messages, ChatMessage{Role: role, Content: content})
			}
		}
	}

	var maxTokens *int
	if req.MaxOutputTokens != nil {
		maxTokens = req.MaxOutputTokens
	}

	return &ChatRequest{
		Model:       req.Model,
		Messages:    messages,
		Temperature: req.Temperature,
		MaxTokens:   maxTokens,
		Stream:      req.Stream,
	}
}

// Embedding handles vector embedding requests via server-side API.
func (s *AIService) Embedding(ctx context.Context, req *EmbeddingRequest) (*EmbeddingResponse, error) {
	if !s.cfg.Embedding.Enabled {
		return nil, errors.New("server embedding API is not configured")
	}

	url := s.cfg.Embedding.URL
	if !strings.HasSuffix(url, "/embeddings") {
		url = strings.TrimRight(url, "/") + "/embeddings"
	}

	model := req.Model
	if model == "" {
		model = s.cfg.Embedding.Model
	}

	bodyMap := map[string]interface{}{
		"model": model,
		"input": req.Input,
	}

	reqBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return nil, fmt.Errorf("marshal embedding request failed: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("create embedding request failed: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.Embedding.APIKey)

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request embeddings failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read embeddings response failed: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("upstream embedding API error HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var embResp struct {
		Model string `json:"model"`
		Data  []struct {
			Index     int         `json:"index"`
			Embedding interface{} `json:"embedding"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &embResp); err != nil {
		return nil, fmt.Errorf("unmarshal embeddings response failed: %w", err)
	}

	var items []EmbeddingItem
	for _, d := range embResp.Data {
		var vec []float64
		if rawSlice, ok := d.Embedding.([]interface{}); ok {
			for _, val := range rawSlice {
				if f, ok := val.(float64); ok {
					vec = append(vec, f)
				}
			}
		}
		items = append(items, EmbeddingItem{
			Index:     d.Index,
			Embedding: vec,
		})
	}

	return &EmbeddingResponse{
		Object: "list",
		Data:   items,
		Model:  embResp.Model,
	}, nil
}

// FetchModels queries models from the upstream API and formats as OpenAI model list
func (s *AIService) FetchModels(ctx context.Context, isExtra bool) (*ModelListResponse, error) {
	var apiCfg config.APIConfig
	if isExtra {
		apiCfg = s.cfg.ExtraAPI
	} else {
		apiCfg = s.cfg.MainAPI
	}

	if apiCfg.URL == "" || apiCfg.APIKey == "" {
		return nil, errors.New("API未配置")
	}

	var modelNames []string

	if apiCfg.APIType == "gemini" {
		url := fmt.Sprintf("%s/models?key=%s", strings.TrimRight(apiCfg.URL, "/"), apiCfg.APIKey)
		httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return nil, err
		}
		resp, err := s.client.Do(httpReq)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var geminiModels struct {
			Models []struct {
				Name string `json:"name"`
			} `json:"models"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&geminiModels); err != nil {
			return nil, err
		}
		for _, m := range geminiModels.Models {
			modelNames = append(modelNames, strings.TrimPrefix(m.Name, "models/"))
		}
	} else {
		url := strings.TrimRight(apiCfg.URL, "/") + "/models"
		httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return nil, err
		}
		httpReq.Header.Set("Authorization", "Bearer "+apiCfg.APIKey)

		resp, err := s.client.Do(httpReq)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var openAIModels struct {
			Data []struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&openAIModels); err == nil && len(openAIModels.Data) > 0 {
			for _, m := range openAIModels.Data {
				modelNames = append(modelNames, m.ID)
			}
		} else {
			if apiCfg.Model != "" {
				modelNames = append(modelNames, apiCfg.Model)
			}
		}
	}

	var items []ModelItem
	now := time.Now().Unix()
	for _, name := range modelNames {
		items = append(items, ModelItem{
			ID:      name,
			Object:  "model",
			Created: now,
			OwnedBy: "openai",
		})
	}

	return &ModelListResponse{
		Object: "list",
		Data:   items,
	}, nil
}

func extractContentFromMap(m map[string]interface{}) string {
	if choices, ok := m["choices"].([]interface{}); ok && len(choices) > 0 {
		if first, ok := choices[0].(map[string]interface{}); ok {
			if msg, ok := first["message"].(map[string]interface{}); ok {
				if c, ok := msg["content"].(string); ok && c != "" {
					return c
				}
				if r, ok := msg["reasoning_content"].(string); ok && r != "" {
					return r
				}
			}
			if text, ok := first["text"].(string); ok && text != "" {
				return text
			}
		}
	}
	// OpenAI Responses API structure: output: [{ content: [{ type: "output_text"/"text", text: "..." }] }]
	if outputs, ok := m["output"].([]interface{}); ok {
		for _, outItem := range outputs {
			if outMap, ok := outItem.(map[string]interface{}); ok {
				if parts, ok := outMap["content"].([]interface{}); ok {
					for _, p := range parts {
						if pMap, ok := p.(map[string]interface{}); ok {
							if t, ok := pMap["text"].(string); ok && t != "" {
								return t
							}
						}
					}
				}
			}
		}
	}
	if out, ok := m["output_text"].(string); ok && out != "" {
		return out
	}
	if c, ok := m["content"].(string); ok && c != "" {
		return c
	}
	if resp, ok := m["response"].(string); ok && resp != "" {
		return resp
	}
	if text, ok := m["text"].(string); ok && text != "" {
		return text
	}
	return ""
}

func getFloat(m map[string]interface{}, k string) float64 {
	if v, ok := m[k].(float64); ok {
		return v
	}
	return 0
}

func estimateTokens(messages []ChatMessage) int {
	total := 0
	for _, m := range messages {
		total += estimateTokenCount(m.Content) + 4
	}
	return total
}

func estimateTokenCount(text string) int {
	// Rough estimation: ~1 token per 3 English chars or ~1 token per Chinese char
	return len([]rune(text))
}
