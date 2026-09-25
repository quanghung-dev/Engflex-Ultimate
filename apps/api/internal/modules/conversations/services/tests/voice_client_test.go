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
	"engflex-api/internal/modules/conversations/services"
)

func testVoiceClient(t *testing.T, handler http.HandlerFunc) services.VoiceClient {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return services.NewHTTPVoiceClient(config.VoiceConfig{
		ServiceURL:   srv.URL,
		StartTimeout: 2 * time.Second,
		OfferTimeout: 2 * time.Second,
	})
}

func TestVoiceClientStart(t *testing.T) {
	tests := []struct {
		name     string
		status   int
		body     string
		wantErr  bool
		wantSess string
	}{
		{name: "ok", status: http.StatusOK, body: `{"sessionId":"eng-1","iceConfig":{"iceServers":[{"urls":["stun:stun.l.google.com:19302"]}]}}`, wantSess: "eng-1"},
		{name: "engine 500", status: http.StatusInternalServerError, body: `{"message":"boom"}`, wantErr: true},
		{name: "malformed json", status: http.StatusOK, body: `{`, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := testVoiceClient(t, func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "/start", r.URL.Path)
				w.WriteHeader(tt.status)
				_, _ = w.Write([]byte(tt.body))
			})

			res, err := client.Start(context.Background(), services.StartRequest{
				Transport:               "webrtc",
				EnableDefaultICEServers: true,
				Body: services.VoiceSessionBody{
					UserID: "u1", ConversationID: "c1", MaxDuration: 300,
				},
			})
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.wantSess, res.SessionID)
			require.NotNil(t, res.ICEConfig)
			assert.Len(t, res.ICEConfig.IceServers, 1)
		})
	}
}

func TestVoiceClientOfferPassThrough(t *testing.T) {
	client := testVoiceClient(t, func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/sessions/eng-1/api/offer", r.URL.Path)
		assert.Equal(t, http.MethodPost, r.Method)
		raw, _ := json.Marshal(map[string]any{"echo": true})
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write(raw)
	})

	body, status, err := client.Offer(context.Background(), "eng-1", http.MethodPost, []byte(`{"sdp":"x"}`))
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, status)
	assert.JSONEq(t, `{"echo": true}`, string(body))
}
