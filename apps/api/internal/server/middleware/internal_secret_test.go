package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/server/middleware"
)

func TestRequireInternalSecret(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name       string
		header     string
		wantStatus int
	}{
		{name: "valid secret", header: "s3cret", wantStatus: http.StatusOK},
		{name: "wrong secret", header: "nope", wantStatus: http.StatusUnauthorized},
		{name: "missing secret", header: "", wantStatus: http.StatusUnauthorized},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.POST("/internal", middleware.RequireInternalSecret("s3cret"), func(c *gin.Context) {
				c.Status(http.StatusOK)
			})

			req := httptest.NewRequest(http.MethodPost, "/internal", nil)
			if tt.header != "" {
				req.Header.Set("X-Internal-Secret", tt.header)
			}
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, req)
			assert.Equal(t, tt.wantStatus, rec.Code)
			if tt.wantStatus == http.StatusUnauthorized {
				require.Contains(t, rec.Body.String(), "message")
			}
		})
	}
}
