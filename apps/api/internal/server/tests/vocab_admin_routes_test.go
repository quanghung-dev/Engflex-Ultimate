package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"engflex-api/config"
	"engflex-api/internal/server"
)

// TestVocabularyCategoryAdminRoutesRequireAuth guards against silently
// losing RequireAuth() while wiring RequireAdmin() on vocabulary-categories.
// Only the taxonomy (vocabulary-categories) is admin-gated: decks,
// deck-items, and vocabulary-items carry a nullable owner (UserID /
// CreatedByUserID) for user-created content and must stay RequireAuth-only.
// The admin-vs-user 403 split is already covered generically by
// TestRequireAdmin in middleware/role_test.go; a real Clerk-signed token is
// needed to exercise that distinction end to end, which only the manual
// Swagger pass can provide.
func TestVocabularyCategoryAdminRoutesRequireAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	uuid := "00000000-0000-0000-0000-000000000000"
	tests := []struct{ method, path string }{
		{http.MethodPost, "/api/v1/vocabulary-categories"},
		{http.MethodPut, "/api/v1/vocabulary-categories/" + uuid},
		{http.MethodDelete, "/api/v1/vocabulary-categories/" + uuid},
	}

	for _, tt := range tests {
		t.Run(tt.method+" "+tt.path, func(t *testing.T) {
			r := server.NewRouter(nil, config.Config{})
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest(tt.method, tt.path, nil))
			assert.Equal(t, http.StatusUnauthorized, w.Code)
		})
	}
}
