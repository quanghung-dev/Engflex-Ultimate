package tests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/config"
	"engflex-api/internal/llm"
)

type probeOut struct {
	Answer string `json:"answer"`
}

func testServer(t *testing.T, handler http.HandlerFunc) (*httptest.Server, llm.LLMClient) {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return srv, llm.NewHTTPLLMClient(config.LLMConfig{
		BaseURL: srv.URL, APIKey: "k", Model: "m", Timeout: 5 * time.Second,
	})
}

func TestCompleteStructured(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		status  int
		raw     bool
		wantErr bool
		want    string
	}{
		{name: "exact json", body: `{"answer":"yes"}`, status: http.StatusOK, want: "yes"},
		{name: "markdown fenced", body: "here:\n```json\n{\"answer\":\"yes\"}\n```", status: http.StatusOK, want: "yes"},
		{name: "leading prose", body: "Sure. {\"answer\":\"yes\"} done.", status: http.StatusOK, want: "yes"},
		{name: "no json", body: "no braces here", status: http.StatusOK, wantErr: true},
		{name: "empty choices", body: `{"choices":[]}`, status: http.StatusOK, raw: true, wantErr: true},
		{name: "server error", body: "boom", status: http.StatusBadGateway, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, client := testServer(t, func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "/chat/completions", r.URL.Path)
				assert.Equal(t, "Bearer k", r.Header.Get("Authorization"))
				var req map[string]any
				require.NoError(t, json.NewDecoder(r.Body).Decode(&req))
				rf, _ := req["response_format"].(map[string]any)
				assert.Equal(t, "json_schema", rf["type"])
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tt.status)
				if tt.raw {
					_, _ = w.Write([]byte(tt.body))
					return
				}
				_ = json.NewEncoder(w).Encode(map[string]any{
					"choices": []any{map[string]any{"message": map[string]any{"content": tt.body}}},
				})
			})
			var out probeOut
			schema := map[string]any{"type": "object"}
			err := client.CompleteStructured(context.Background(), "p", &out, "probe", schema)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, out.Answer)
		})
	}
}
