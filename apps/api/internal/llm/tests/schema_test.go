package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/llm"
)

type nestedProbe struct {
	Name string `json:"name"`
}

type schemaProbe struct {
	Title  string        `json:"title"`
	Nested nestedProbe   `json:"nested"`
	Items  []nestedProbe `json:"items"`
}

func assertStrict(t *testing.T, node map[string]any) {
	t.Helper()
	props, ok := node["properties"].(map[string]any)
	require.True(t, ok, "object level without properties")
	assert.Equal(t, false, node["additionalProperties"])
	required, ok := node["required"].([]any)
	require.True(t, ok, "object level without required")
	got := map[string]bool{}
	for _, r := range required {
		got[r.(string)] = true
	}
	for name, sub := range props {
		assert.True(t, got[name], "property %s missing from required", name)
		if child, ok := sub.(map[string]any); ok {
			if _, hasProps := child["properties"]; hasProps {
				assertStrict(t, child)
			}
			if items, ok := child["items"].(map[string]any); ok {
				if _, hasProps := items["properties"]; hasProps {
					assertStrict(t, items)
				}
			}
		}
	}
}

func TestGenerateSchemaIsStrictCompliant(t *testing.T) {
	assertStrict(t, llm.GenerateSchema[schemaProbe]())
}
