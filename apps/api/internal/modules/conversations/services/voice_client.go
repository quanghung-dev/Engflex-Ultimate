package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"engflex-api/config"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/modules/conversations/dtos/responses"
)

// VoiceSessionBody is the per-session payload the engine parses. Persona,
// Scenario, and Learner are structured prompt inputs; the engine owns the
// template. All three stay nil for free talk.
type VoiceSessionBody struct {
	UserID         string             `json:"userId"`
	ConversationID string             `json:"conversationId"`
	MaxDuration    int                `json:"maxDuration"`
	Persona        *VoicePersonaBody  `json:"persona,omitempty"`
	Scenario       *VoiceScenarioBody `json:"scenario,omitempty"`
	Learner        *VoiceLearnerBody  `json:"learner,omitempty"`
}

// VoicePersonaBody mirrors the engine's PersonaBody.
type VoicePersonaBody struct {
	Name        string `json:"name"`
	RoleTitle   string `json:"roleTitle"`
	Personality string `json:"personality,omitempty"`
	Style       string `json:"style,omitempty"`
	Objective   string `json:"objective,omitempty"`
}

// VoiceScenarioBody mirrors the engine's ScenarioBody.
type VoiceScenarioBody struct {
	Title     string `json:"title"`
	Objective string `json:"objective,omitempty"`
	CEFRLevel string `json:"cefrLevel,omitempty"`
}

// VoiceLearnerBody mirrors the engine's LearnerBody. P2 sends nil and lets
// the engine default to B1; the profiles module is not wired yet.
type VoiceLearnerBody struct {
	Level string   `json:"level"`
	Goals []string `json:"goals,omitempty"`
}

// StartRequest mirrors the Pipecat runner /start body.
type StartRequest struct {
	Transport               string           `json:"transport"`
	EnableDefaultICEServers bool             `json:"enableDefaultIceServers"`
	Body                    VoiceSessionBody `json:"body"`
}

// StartResponse is the engine's /start reply (cached for idempotent starts).
type StartResponse struct {
	SessionID string               `json:"sessionId"`
	ICEConfig *responses.IceConfig `json:"iceConfig,omitempty"`
}

// AnalyzeTurnRequest is the per-turn analysis payload. It carries the turn
// text and the prior turns, and deliberately nothing else: the conversation
// context already expresses the topic, and "is this correct English" does not
// vary by CEFR level.
type AnalyzeTurnRequest struct {
	ConversationID string
	TurnID         string
	Text           string
	Context        []ContextTurn
}

// ContextTurn is one prior transcript line supplied as analysis context.
type ContextTurn struct {
	Role enums.TurnRole `json:"role"`
	Text string         `json:"text"`
}

// AnalyzeTurnResponse carries the engine's feedback object verbatim.
type AnalyzeTurnResponse struct {
	Feedback json.RawMessage `json:"feedback"`
}

// VoiceClient talks to the Python engine (dev runner or P3 supervisor).
type VoiceClient interface {
	Start(ctx context.Context, req StartRequest) (*StartResponse, error)
	Offer(ctx context.Context, engineSessionID, method string, body []byte) ([]byte, int, error)
	AnalyzeTurn(ctx context.Context, req AnalyzeTurnRequest) (*AnalyzeTurnResponse, error)
	// Transcript is the one learner-initiated, session-scoped command. The
	// engine owns the live transcript and the window state, so Go only checks
	// ownership and forwards.
	Transcript(ctx context.Context, conversationID, action, text string) (*responses.TranscriptResult, error)
}

type httpVoiceClient struct {
	baseURL        string
	http           *http.Client
	startTimeout   time.Duration
	offerTimeout   time.Duration
	analyzeTimeout time.Duration
}

func NewHTTPVoiceClient(cfg config.VoiceConfig) VoiceClient {
	return &httpVoiceClient{
		baseURL:        cfg.ServiceURL,
		http:           &http.Client{},
		startTimeout:   cfg.StartTimeout,
		offerTimeout:   cfg.OfferTimeout,
		analyzeTimeout: cfg.AnalyzeTimeout,
	}
}

func (c *httpVoiceClient) AnalyzeTurn(ctx context.Context, req AnalyzeTurnRequest) (*AnalyzeTurnResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, c.analyzeTimeout)
	defer cancel()

	payload, err := json.Marshal(map[string]any{
		"conversationId": req.ConversationID,
		"turnId":         req.TurnID,
		"text":           req.Text,
		"context":        req.Context,
	})
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/analyze", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("voice analyze failed: %d", resp.StatusCode)
	}
	var out AnalyzeTurnResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *httpVoiceClient) Start(ctx context.Context, req StartRequest) (*StartResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, c.startTimeout)
	defer cancel()

	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/start", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("voice start failed: %d", resp.StatusCode)
	}
	var out StartResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	if out.SessionID == "" {
		return nil, fmt.Errorf("voice start returned an empty session id")
	}
	return &out, nil
}

func (c *httpVoiceClient) Offer(ctx context.Context, engineSessionID, method string, body []byte) ([]byte, int, error) {
	ctx, cancel := context.WithTimeout(ctx, c.offerTimeout)
	defer cancel()

	url := fmt.Sprintf("%s/sessions/%s/api/offer", c.baseURL, engineSessionID)
	httpReq, err := http.NewRequestWithContext(ctx, method, url, bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, err
	}
	return respBody, resp.StatusCode, nil
}

func (c *httpVoiceClient) Transcript(ctx context.Context, conversationID, action, text string) (*responses.TranscriptResult, error) {
	body, err := json.Marshal(map[string]any{
		"conversationId": conversationID,
		"action":         action,
		"text":           text,
	})
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(ctx, c.analyzeTimeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/transcript", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, &TranscriptStatusError{Path: "/transcript", Status: resp.StatusCode, Body: raw}
	}
	var out responses.TranscriptResult
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
