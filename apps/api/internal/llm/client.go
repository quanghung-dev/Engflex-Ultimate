// Package llm is the Go-side OpenAI-compatible chat client for text-only
// scoring. Strategy is strict json_schema first with a tolerant
// extract-and-repair fallback: proxies may accept response_format and still
// answer in markdown (observed on the voice path).
package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"engflex-api/config"
	"github.com/kaptinlin/jsonrepair"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/shared"
)

// LLMClient talks to an OpenAI-compatible chat endpoint.
type LLMClient interface {
	CompleteText(ctx context.Context, prompt string) (string, error)
	CompleteStructured(ctx context.Context, prompt string, output any, schemaName string, schema map[string]any) error
}

type httpLLMClient struct {
	sdk     *openai.Client
	model   string
	timeout time.Duration
}

// NewHTTPLLMClient builds the client over the shared SDK handle.
func NewHTTPLLMClient(cfg config.LLMConfig) LLMClient {
	sdk := openai.NewClient(
		option.WithAPIKey(cfg.APIKey),
		option.WithBaseURL(cfg.BaseURL),
	)
	return &httpLLMClient{sdk: &sdk, model: cfg.Model, timeout: cfg.Timeout}
}

func (c *httpLLMClient) CompleteText(ctx context.Context, prompt string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	resp, err := c.sdk.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model:       openai.ChatModel(c.model),
		Messages:    []openai.ChatCompletionMessageParamUnion{openai.UserMessage(prompt)},
		Temperature: openai.Float(0.2),
	})
	if err != nil {
		return "", err
	}
	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no completion choices returned")
	}
	return resp.Choices[0].Message.Content, nil
}

func (c *httpLLMClient) CompleteStructured(ctx context.Context, prompt string, output any, schemaName string, schema map[string]any) error {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	resp, err := c.sdk.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(c.model),
		Messages: []openai.ChatCompletionMessageParamUnion{openai.UserMessage(prompt)},
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONSchema: &shared.ResponseFormatJSONSchemaParam{
				Type: "json_schema",
				JSONSchema: shared.ResponseFormatJSONSchemaJSONSchemaParam{
					Name:   schemaName,
					Schema: schema,
					Strict: openai.Bool(true),
				},
			},
		},
		Temperature: openai.Float(0.2),
	})
	if err != nil {
		return err
	}
	if len(resp.Choices) == 0 {
		return fmt.Errorf("no completion choices returned")
	}
	content := resp.Choices[0].Message.Content
	if err := json.Unmarshal([]byte(content), output); err == nil {
		return nil
	}
	repaired, rerr := jsonrepair.Repair(extractJSONObject(content))
	if rerr != nil {
		return fmt.Errorf("llm reply held no usable JSON: %w", rerr)
	}
	if err := json.Unmarshal([]byte(repaired), output); err != nil {
		return fmt.Errorf("llm reply failed validation: %w", err)
	}
	return nil
}

// extractJSONObject returns the first balanced {...} block, else "".
func extractJSONObject(raw string) string {
	for i := 0; i < len(raw); i++ {
		if raw[i] != '{' {
			continue
		}
		depth, inStr, esc := 0, false, false
		for j := i; j < len(raw); j++ {
			ch := raw[j]
			if inStr {
				if esc {
					esc = false
				} else if ch == '\\' {
					esc = true
				} else if ch == '"' {
					inStr = false
				}
				continue
			}
			switch ch {
			case '"':
				inStr = true
			case '{':
				depth++
			case '}':
				depth--
				if depth == 0 {
					return raw[i : j+1]
				}
			}
		}
	}
	return ""
}
