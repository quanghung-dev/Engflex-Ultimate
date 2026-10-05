package services

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/logger"
)

// analysisContextTurns is how many prior lines the engine sees: enough for
// coherence, cheap enough to stay inside the caller's 60s budget.
const analysisContextTurns = 5

// NormalizeLanguageFeedback validates the engine payload and returns it as
// the stored document. The engine already validated with pydantic; this is
// the last gate before the database, and the only place that guarantees the
// arrays the UI iterates are non-null (the panel maps them directly). Exported
// so the service's external test package can reach it.
func NormalizeLanguageFeedback(raw json.RawMessage) (models.TurnFeedback, error) {
	var present map[string]json.RawMessage
	if err := json.Unmarshal(raw, &present); err != nil {
		return models.TurnFeedback{}, err
	}
	// All five keys must be present: the engine contract guarantees them, so
	// a missing key means validation was bypassed or the shape drifted.
	for _, key := range []string{"corrected", "spans", "relevance", "alternatives", "tip"} {
		if _, ok := present[key]; !ok {
			return models.TurnFeedback{}, common.BadRequest("feedback is missing " + key)
		}
	}
	var fb models.TurnFeedback
	if err := json.Unmarshal(raw, &fb); err != nil {
		return models.TurnFeedback{}, err
	}
	if fb.Corrected == "" || fb.Tip == "" {
		// The two fields the UI cannot render without.
		return models.TurnFeedback{}, common.BadRequest("feedback is missing corrected or tip")
	}
	if fb.Spans == nil {
		fb.Spans = []models.AnalysisSpan{}
	}
	return fb, nil
}

// BuildAnalyzeRequest assembles the engine payload for one turn: the text
// plus the preceding turns. No level, no objective: the conversation context
// already expresses the topic, and "is this correct English" does not vary
// by level.
func (s *ConversationService) BuildAnalyzeRequest(ctx context.Context, conversationID string, position int) (AnalyzeTurnRequest, error) {
	turn, err := s.turns.GetTurnByPosition(ctx, conversationID, position)
	if err != nil {
		appErr := common.FromDBError(err, "conversation turn")
		logger.Report(ctx, "analyze turn lookup failed", appErr, "conversationID", conversationID, "position", position)
		return AnalyzeTurnRequest{}, appErr
	}
	if turn.Role != enums.TurnRoleUser {
		return AnalyzeTurnRequest{}, common.BadRequest("only learner turns can be analyzed")
	}
	all, err := s.turns.ListTurns(ctx, conversationID)
	if err != nil {
		appErr := common.FromDBError(err, "conversation turn")
		logger.Report(ctx, "analyze turn context failed", appErr, "conversationID", conversationID)
		return AnalyzeTurnRequest{}, appErr
	}
	return AnalyzeTurnRequest{
		ConversationID: conversationID,
		TurnID:         turn.ID,
		Text:           turn.Text,
		Context:        priorTurns(all, turn.ID, analysisContextTurns),
	}, nil
}

// AnalyzeTurn runs one synchronous analysis pass for one learner turn and
// upserts its feedback row. Any transport error, empty body, or
// wrong-shaped payload returns an error and writes nothing, so a turn never
// carries a half-decoded feedback.
func (s *ConversationService) AnalyzeTurn(ctx context.Context, userID, conversationID string, position int) (*models.Feedback, error) {
	if _, err := s.getOwned(ctx, userID, conversationID); err != nil {
		return nil, err
	}
	req, err := s.BuildAnalyzeRequest(ctx, conversationID, position)
	if err != nil {
		return nil, err
	}

	res, err := s.voice.AnalyzeTurn(ctx, req)
	if err != nil || res == nil || len(bytes.TrimSpace(res.Feedback)) == 0 {
		logger.Report(ctx, "analyze turn engine call failed", common.ServiceUnavailable("analysis unavailable"), "conversationID", conversationID, "position", position)
		return nil, common.ServiceUnavailable("analysis unavailable")
	}
	payload, err := NormalizeLanguageFeedback(res.Feedback)
	if err != nil {
		// A shape drift from the engine is not an outage. The caller can act
		// on neither answer, so the response stays 503 — but the log must say
		// what actually happened, or an engine contract change reads as a
		// voice-service outage for hours.
		logger.Report(ctx, "analyze turn feedback rejected", common.ServiceUnavailable("analysis unavailable"),
			"conversationID", conversationID, "position", position, "reason", err.Error())
		return nil, common.ServiceUnavailable("analysis unavailable")
	}

	feedback := &models.Feedback{
		UserID:      userID,
		SubjectType: enums.FeedbackSubjectConversationTurn,
		SubjectID:   req.TurnID,
		Payload:     payload,
	}
	if err := s.feedbacks.Upsert(ctx, feedback); err != nil {
		appErr := common.FromDBError(err, "feedback")
		logger.Report(ctx, "store turn feedback failed", appErr, "conversationID", conversationID, "position", position)
		return nil, appErr
	}
	slog.InfoContext(ctx, "turn analyzed", "conversationID", conversationID, "position", position)
	return feedback, nil
}

// priorTurns returns the turns preceding target, oldest first, capped at limit.
func priorTurns(all []*models.ConversationTurn, targetID string, limit int) []ContextTurn {
	cut := len(all)
	for i, turn := range all {
		if turn.ID == targetID {
			cut = i
			break
		}
	}
	prior := all[:cut]
	if len(prior) > limit {
		prior = prior[len(prior)-limit:]
	}
	out := make([]ContextTurn, 0, len(prior))
	for _, turn := range prior {
		out = append(out, ContextTurn{Role: turn.Role, Text: turn.Text})
	}
	return out
}

// GetWithFeedback returns the conversation and its transcript, with each
// turn's coaching record already attached by the repository join: one query,
// no in-memory join here. A turn whose stored payload cannot be decoded comes
// back with a nil Feedback, because an empty coaching panel is worse than no
// panel.
func (s *ConversationService) GetWithFeedback(ctx context.Context, userID, id string) (*models.Conversation, []*models.ConversationTurn, error) {
	conv, err := s.getOwned(ctx, userID, id)
	if err != nil {
		return nil, nil, err
	}
	turns, err := s.turns.ListTurnsWithFeedback(ctx, id)
	if err != nil {
		// A transcript read failure must not 404 the conversation.
		appErr := common.FromDBError(err, "conversation turn")
		logger.Report(ctx, "get conversation turns failed", appErr, "conversationID", id)
		return conv, nil, nil
	}
	for _, turn := range turns {
		// NormalizeLanguageFeedback rejects an empty corrected string on
		// write, so an empty one here means the stored blob is unreadable.
		if turn.Feedback != nil && turn.Feedback.Payload.Corrected == "" {
			turn.Feedback = nil
		}
	}
	return conv, turns, nil
}
