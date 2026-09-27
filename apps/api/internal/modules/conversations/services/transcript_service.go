package services

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"engflex-api/internal/common"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/conversations/dtos/responses"
)

// TranscriptStatusError carries a non-2xx engine reply. The engine owns the
// window and the live transcript, so its refusals are meaningful to the
// learner: "no live session" (close the modal), "illegal for the current state",
// and "unusable text" are all answers, not outages. Collapsing them into one
// 503 would leave the web unable to tell a finished session from a broken
// engine.
type TranscriptStatusError struct {
	Path   string
	Status int
	Body   []byte
}

func (e *TranscriptStatusError) Error() string {
	return "voice transcript " + e.Path + " failed: " + http.StatusText(e.Status)
}

// transcriptError maps an engine failure onto the API's error vocabulary,
// preserving the refusals and treating everything else as unavailable.
func transcriptError(ctx context.Context, action, conversationID string, err error) error {
	var status *TranscriptStatusError
	if errors.As(err, &status) {
		switch status.Status {
		case http.StatusNotFound:
			logger.Report(ctx, "transcript refused", common.NotFound("no live session"), "conversationID", conversationID)
			return common.NotFound("no live session")
		case http.StatusConflict:
			logger.Report(ctx, "transcript refused", common.Conflict("nothing to act on"), "conversationID", conversationID)
			return common.Conflict("nothing to act on")
		case http.StatusUnprocessableEntity, http.StatusBadRequest:
			logger.Report(ctx, "transcript refused", common.UnprocessableEntity("unusable correction"), "conversationID", conversationID)
			return common.UnprocessableEntity("unusable correction")
		}
	}
	logger.Report(ctx, "transcript engine call failed", common.ServiceUnavailable("transcript unavailable"), "conversationID", conversationID)
	return common.ServiceUnavailable("transcript unavailable")
}

// Transcript applies one learner-initiated correction command. It is a
// pass-through on purpose: the engine owns the window state, resolves which turn
// is being corrected, and hands back its own copy of the text. Go checks that
// the conversation is the caller's, forwards, and maps the answer.
func (s *ConversationService) Transcript(ctx context.Context, userID, conversationID, action, text string) (*responses.TranscriptResult, error) {
	if _, err := s.getOwned(ctx, userID, conversationID); err != nil {
		return nil, err
	}
	res, err := s.voice.Transcript(ctx, conversationID, action, text)
	if err != nil || res == nil {
		return nil, transcriptError(ctx, action, conversationID, err)
	}
	slog.InfoContext(ctx, "transcript command applied",
		"conversationID", conversationID, "action", action, "state", res.State)
	return res, nil
}
