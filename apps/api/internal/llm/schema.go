package llm

import (
	"encoding/json"

	"github.com/invopop/jsonschema"
)

// GenerateSchema reflects T into a strict-mode JSON schema map: every object
// level gets additionalProperties false with all properties required.
// OpenAI strict mode rejects anything else, and the Reflector's defaults are
// not pinned to that contract. Structs using this keep all fields required
// (no optional semantics under strict mode).
func GenerateSchema[T any]() map[string]any {
	s := (&jsonschema.Reflector{ExpandedStruct: true}).Reflect(new(T))
	raw, _ := json.Marshal(s)
	var out map[string]any
	_ = json.Unmarshal(raw, &out)
	walkStrict(out)
	return out
}

func walkStrict(node map[string]any) {
	props, _ := node["properties"].(map[string]any)
	if props == nil {
		return
	}
	node["additionalProperties"] = false
	required := make([]any, 0, len(props))
	for name, sub := range props {
		required = append(required, name)
		child, _ := sub.(map[string]any)
		if child == nil {
			continue
		}
		walkStrict(child)
		if items, ok := child["items"].(map[string]any); ok {
			walkStrict(items)
		}
	}
	node["required"] = required
}
