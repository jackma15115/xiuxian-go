package config

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type APIConfig struct {
	URL        string `json:"url"`
	APIKey     string `json:"-"`
	Model      string `json:"model"`
	APIType    string `json:"apiType"`    // "openai" or "gemini"
	StreamMode string `json:"streamMode"` // "auto" (default/native), "stream" (force stream), "sync" (force non-stream)
}

type EmbeddingConfig struct {
	URL     string `json:"url"`
	APIKey  string `json:"-"`
	Model   string `json:"model"`
	Enabled bool   `json:"enabled"`
}

type Config struct {
	Port      string          `json:"port"`
	MainAPI   APIConfig       `json:"mainApi"`
	ExtraAPI  APIConfig       `json:"extraApi"`
	Embedding EmbeddingConfig `json:"embedding"`
}

// Load loads configuration from .env and environment variables.
func Load() *Config {
	// Try loading .env if it exists
	loadDotEnv()

	port := getEnv("PORT", "8080")

	// Main API
	mainURL := getEnvAny("URL", "AI_URL", "OPENAI_BASE_URL", "OPENAI_URL")
	mainKey := getEnvAny("APIKEY", "AI_APIKEY", "API_KEY", "AI_API_KEY", "OPENAI_API_KEY")
	mainModel := getEnvAny("MODEL", "AI_MODEL", "OPENAI_MODEL")
	mainType := strings.ToLower(getEnvAny("API_TYPE", "AI_TYPE"))
	if mainType == "" {
		if strings.Contains(strings.ToLower(mainURL), "generativelanguage.googleapis.com") {
			mainType = "gemini"
		} else {
			mainType = "openai"
		}
	}
	mainStreamMode := parseStreamMode(getEnvAny("FORCE_STREAM", "STREAM_MODE", "AI_FORCE_STREAM", "AI_STREAM_MODE"))

	// Extra API
	extraURL := getEnvAny("EXTRA_URL", "EXTRA_AI_URL")
	extraKey := getEnvAny("EXTRA_APIKEY", "EXTRA_AI_APIKEY", "EXTRA_API_KEY", "EXTRA_AI_API_KEY")
	extraModel := getEnvAny("EXTRA_MODEL", "EXTRA_AI_MODEL")
	extraType := strings.ToLower(getEnvAny("EXTRA_API_TYPE", "EXTRA_AI_TYPE"))
	extraStreamRaw := getEnvAny("EXTRA_FORCE_STREAM", "EXTRA_STREAM_MODE", "EXTRA_AI_FORCE_STREAM", "EXTRA_AI_STREAM_MODE")

	// Fallback rule: 如果额外API未配置，默认走主API
	if extraURL == "" {
		extraURL = mainURL
	}
	if extraKey == "" {
		extraKey = mainKey
	}
	if extraModel == "" {
		extraModel = mainModel
	}
	if extraType == "" {
		extraType = mainType
	}
	extraStreamMode := mainStreamMode
	if extraStreamRaw != "" {
		extraStreamMode = parseStreamMode(extraStreamRaw)
	}

	// Embedding API
	embModel := getEnvAny("EMBEDDING_MODEL", "EMBEDDING_MODEL_NAME")
	embURL := getEnvAny("EMBEDDING_URL", "EMBEDDING_API_URL")
	embKey := getEnvAny("EMBEDDING_APIKEY", "EMBEDDING_API_KEY", "EMBEDDING_KEY")

	// 规则：若设置了 EMBEDDING_MODEL 或 EMBEDDING_URL，则启用服务端向量接口
	// 未配置 EMBEDDING_URL 则回退走主 API URL，未配置 EMBEDDING_APIKEY 则回退走主 API KEY
	// 若未设置 EMBEDDING_MODEL 且未设置 EMBEDDING_URL，则服务端不启用向量，默认走浏览器本地计算
	embConfigured := embModel != "" || embURL != ""
	if embConfigured {
		if embURL == "" {
			embURL = mainURL
		}
		if embKey == "" {
			embKey = mainKey
		}
		if embModel == "" {
			embModel = "text-embedding-3-small"
		}
	}
	embEnabled := embConfigured && embURL != "" && embKey != ""

	cfg := &Config{
		Port: port,
		MainAPI: APIConfig{
			URL:        strings.TrimRight(mainURL, "/"),
			APIKey:     mainKey,
			Model:      mainModel,
			APIType:    mainType,
			StreamMode: mainStreamMode,
		},
		ExtraAPI: APIConfig{
			URL:        strings.TrimRight(extraURL, "/"),
			APIKey:     extraKey,
			Model:      extraModel,
			APIType:    extraType,
			StreamMode: extraStreamMode,
		},
		Embedding: EmbeddingConfig{
			URL:     strings.TrimRight(embURL, "/"),
			APIKey:  embKey,
			Model:   embModel,
			Enabled: embEnabled,
		},
	}

	log.Printf("[Config] Loaded configuration: Port=%s, MainModel=%s (StreamMode=%s), ExtraModel=%s (StreamMode=%s), EmbeddingEnabled=%v (Model=%s)",
		cfg.Port, cfg.MainAPI.Model, cfg.MainAPI.StreamMode, cfg.ExtraAPI.Model, cfg.ExtraAPI.StreamMode, cfg.Embedding.Enabled, cfg.Embedding.Model)

	return cfg
}

func parseStreamMode(val string) string {
	val = strings.ToLower(strings.TrimSpace(val))
	switch val {
	case "true", "1", "stream", "streaming", "force_stream", "always":
		return "stream"
	case "false", "0", "sync", "non-stream", "non_stream", "force_sync", "none":
		return "sync"
	default:
		return "auto" // 没配置按原生规则走
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return defaultVal
}

func getEnvAny(keys ...string) string {
	for _, key := range keys {
		if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
			return strings.TrimSpace(val)
		}
	}
	return ""
}

// loadDotEnv searches and parses .env file from current working directory or binary directory.
func loadDotEnv() {
	candidates := []string{".env"}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(exe), ".env"))
	}

	for _, p := range candidates {
		if parseDotEnvFile(p) {
			log.Printf("[Config] Loaded .env file from: %s", p)
			return
		}
	}
}

func parseDotEnvFile(filePath string) bool {
	file, err := os.Open(filePath)
	if err != nil {
		return false
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			k := strings.TrimSpace(parts[0])
			v := strings.TrimSpace(parts[1])
			// remove quotes if any
			if len(v) >= 2 && ((v[0] == '"' && v[len(v)-1] == '"') || (v[0] == '\'' && v[len(v)-1] == '\'')) {
				v = v[1 : len(v)-1]
			}
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
	}
	return true
}
