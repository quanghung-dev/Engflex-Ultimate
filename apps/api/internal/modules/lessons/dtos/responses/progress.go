package responses

// CheckedQuestion is one already-graded question, rehydrated for resume: the
// learner's pick plus the reveal (correct key + explanation) the check
// unlocked. Only ever served for the attempt owner's open run.
type CheckedQuestion struct {
	Index       int    `json:"index"`
	Key         string `json:"key"`
	Correct     bool   `json:"correct"`
	CorrectKey  string `json:"correctKey"`
	Explanation string `json:"explanation"`
}

// AttemptProgress is the resume payload: run state plus per-activity graded
// questions keyed by activity id. Checkable activities only — writing and
// speaking entries carry no rehydratable answers yet and are omitted.
type AttemptProgress struct {
	Attempt AttemptSummary               `json:"attempt"`
	Checks  map[string][]CheckedQuestion `json:"checks"`
}
