package requests

import (
	"reflect"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/conversations/dtos/callbacks"
)

// No limits_test.go existed in the repo despite the constants comment
// referencing one per module. This file starts the pattern for the
// conversations module: DTO binding tags must equal internal/common
// constants, checked by reading the tags themselves (not by round-tripping
// the constant values, which would pass even after a silent tag change).
func tagMax(t *testing.T, typ reflect.Type, field, rule string) int {
	t.Helper()
	sf, ok := typ.FieldByName(field)
	require.True(t, ok, "field %s.%s missing", typ.Name(), field)
	for part := range strings.SplitSeq(sf.Tag.Get("binding"), ",") {
		if value, found := strings.CutPrefix(part, rule+"="); found {
			n, err := strconv.Atoi(value)
			require.NoError(t, err, "unparseable %s tag on %s", rule, field)
			return n
		}
	}
	t.Fatalf("rule %s missing on %s", rule, field)
	return 0
}

func TestIngestTurnsBindingLimitsMatchConstants(t *testing.T) {
	turnsType := reflect.TypeOf(callbacks.IngestTurns{})
	assertMax := tagMax(t, turnsType, "Turns", "max")
	require.Equal(t, common.MaxTurnsPerBatch, assertMax, "IngestTurns.Turns max must equal MaxTurnsPerBatch")

	turnType := reflect.TypeOf(callbacks.IngestTurn{})
	textMax := tagMax(t, turnType, "Text", "max")
	require.Equal(t, common.TextMaxLength, textMax, "IngestTurn.Text max must equal TextMaxLength")
}
