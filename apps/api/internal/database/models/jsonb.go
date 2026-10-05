package models

import (
	"database/sql/driver"
	"encoding/json"
)

// jsonbValue marshals a typed jsonb column for writes. json.Marshal has no
// nil result, so a zero struct still writes an object of zero values rather
// than SQL NULL — which matters because these columns are NOT NULL.
func jsonbValue[T any](v T) (driver.Value, error) {
	return json.Marshal(v)
}

// jsonbScan decodes a typed jsonb column on reads. NULL, an empty blob, a
// malformed document, and a driver value of an unexpected type all leave the
// zero value in place, so one broken row can never fail the whole query.
func jsonbScan[T any](value any, dst *T) {
	if value == nil {
		return
	}
	var raw []byte
	switch v := value.(type) {
	case []byte:
		raw = v
	case string:
		raw = []byte(v)
	default:
		return
	}
	if len(raw) == 0 {
		return
	}
	if err := json.Unmarshal(raw, dst); err != nil {
		var zero T
		*dst = zero
	}
}
