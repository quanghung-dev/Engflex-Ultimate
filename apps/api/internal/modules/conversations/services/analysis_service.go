package services

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"

	"gorm.io/datatypes"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/conversations/dtos/responses"
)

// analysisContextTurns is how many prior lines the engine sees: enough for
// coherence, cheap enough to stay inside the caller's 60s budget.
const analysisContextTurns = 5

// NormalizeLanguageFeedback validates the engine payload, fills the arrays
// the UI iterates, and drops any speech block. P2 has no acoustic source, so
// a speech score here would be fabricated by the model (spec D11). The
// engine already validated with pydantic; this is the last gate before the
// database. Exported so the service's external test package can reach it.
func NormalizeLanguageFeedback(raw json.RawMessage) (datatypes.JSON, error) {
	var present map[string]json.RawMessage
	if err := json.Unmarshal(raw, &present); err != nil {
		return nil, err
	}
	// All four keys must be present: the engine contract guarantees them, so
	// a missing key means validation was bypassed or the shape drifted.
	for _, key := range []string{"annotated", "marks", "upgrades", "tip"} {
		if _, ok := present[key]; !ok {
			return nil, common.BadRequest("feedback is missing " + key)
		}
	}
	var fb responses.TurnFeedback
	if err := json.Unmarshal(raw, &fb); err != nil {
		return nil, err
	}
	if fb.Annotated == "" || fb.Tip == "" {
		// The two fields the UI cannot render without.
		return nil, common.BadRequest("feedback is missing annotated or tip")
	}
	fb.Speech = nil
	if fb.Marks == nil {
		fb.Marks = []responses.WordMark{}
	}
	if fb.Upgrades == nil {
		fb.Upgrades = []responses.PhraseUpgrade{}
	}
	out, err := json.Marshal(fb)
	if err != nil {
		return nil, err
	}
	return datatypes.JSON(out), nil
}

// BuildAnalyzeRequest assembles the engine payload for one turn: the text
// plus the preceding turns. No level, no objective: the conversation context
// already expresses the topic, and "is this correct English" does not vary
// by level.
func (s *ConversationService) BuildAnalyzeRequest(ctx context.Context, conversationID string, position int) (AnalyzeTurnRequest, error) {
	turn, err := s.conversations.GetTurnByPosition(ctx, conversationID, position)
	if err != nil {
		appErr := common.FromDBError(err, "conversation turn")
		logger.Report(ctx, "analyze turn lookup failed", appErr, "conversationID", conversationID, "position", position)
		return AnalyzeTurnRequest{}, appErr
	}
	if turn.Role != enums.TurnRoleUser {
		return AnalyzeTurnRequest{}, common.BadRequest("only learner turns can be analyzed")
	}
	all, err := s.conversations.ListTurns(ctx, conversationID)
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
		logger.Report(ctx, "analyze turn feedback rejected", common.ServiceUnavailable("analysis unavailable"), "conversationID", conversationID, "position", position)
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

// GetWithFeedback returns the conversation with its turns and their feedback
// as two queries, not a join in the service (repo rule: no joins here).
func (s *ConversationService) GetWithFeedback(ctx context.Context, userID, id string) (*models.Conversation, []*models.ConversationTurn, []*models.Feedback, error) {
	conv, err := s.getOwned(ctx, userID, id)
	if err != nil {
		return nil, nil, nil, err
	}
	turns, err := s.conversations.ListTurns(ctx, id)
	if err != nil {
		// A transcript read failure must not 404 the conversation.
		appErr := common.FromDBError(err, "conversation turn")
		logger.Report(ctx, "get conversation turns failed", appErr, "conversationID", id)
		return conv, nil, nil, nil
	}
	ids := make([]string, 0, len(turns))
	for _, turn := range turns {
		ids = append(ids, turn.ID)
	}
	feedbacks, err := s.feedbacks.ListForSubjects(ctx, userID, string(enums.FeedbackSubjectConversationTurn), ids)
	if err != nil {
		appErr := common.FromDBError(err, "feedback")
		logger.Report(ctx, "get conversation feedback failed", appErr, "conversationID", id)
		return conv, turns, nil, nil
	}
	return conv, turns, feedbacks, nil
}
