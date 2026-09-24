// Package middleware holds shared gin middleware.
package middleware

import (
	"log/slog"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/logger"
)

// userIDKey is the gin context key holding the authenticated user ID
// (Clerk session subject). Canonical name is userID everywhere:
// context key, logs (user_id), DB user_id columns, DTOs.
const userIDKey = "userID"

// noopWriter discards writes: WithHeaderAuthorization never writes, it only
// enriches the request context, so nothing is lost in the gin adaptation.
type noopWriter struct{ header http.Header }

func (w noopWriter) Header() http.Header       { return w.header }
func (noopWriter) Write(b []byte) (int, error) { return len(b), nil }
func (noopWriter) WriteHeader(int)             {}

// RequireAuth verifies the Clerk Bearer session token and stores the userID
// (token subject) in the gin context. Requests without valid claims get the
// standard {message} 401 and the chain stops.
func RequireAuth() gin.HandlerFunc {
	verifier := clerkhttp.WithHeaderAuthorization()
	return func(c *gin.Context) {
		verifier(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
			c.Request = r
		})).ServeHTTP(noopWriter{header: http.Header{}}, c.Request)

		claims, ok := clerk.SessionClaimsFromContext(c.Request.Context())
		if !ok || claims.Subject == "" {
			slog.WarnContext(c.Request.Context(), "request rejected: unauthenticated",
				"method", c.Request.Method,
				"path", c.Request.URL.Path,
			)
			common.Fail(c, common.Unauthorized("sign in required"))
			c.Abort()
			return
		}
		c.Set(userIDKey, claims.Subject)
		// Stamp user_id on downstream logs (services, request logger).
		c.Request = c.Request.WithContext(
			logger.WithUserID(c.Request.Context(), claims.Subject),
		)
		c.Next()
	}
}

// UserID returns the authenticated userID, or "" when absent
// (controllers behind RequireAuth always have one).
func UserID(c *gin.Context) string {
	id, _ := c.Get(userIDKey)
	sub, _ := id.(string)
	return sub
}
