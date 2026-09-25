// Package callbacks holds wire DTOs for service-to-service calls only.
// It is intentionally absent from apps/api/tygo.yaml so these shapes never
// leak into the frontend contracts. (Named callbacks, not internal: a Go
// internal/ directory would be importable only from inside dtos/ —
// controllers/ could not use it.)
package callbacks

// FinalizeConversation is the engine -> Go finalize callback body.
type FinalizeConversation struct {
	DurationSec int `json:"durationSec" binding:"required,min=0"`
}
