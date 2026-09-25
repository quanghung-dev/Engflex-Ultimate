package middleware

import (
	"crypto/subtle"

	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
)

// InternalSecretHeader authenticates service-to-service callbacks
// (Python engine -> Go) with a shared secret.
const InternalSecretHeader = "X-Internal-Secret"

// RequireInternalSecret rejects requests whose X-Internal-Secret header does
// not match the configured secret, using a constant-time comparison.
func RequireInternalSecret(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		provided := c.GetHeader(InternalSecretHeader)
		if subtle.ConstantTimeCompare([]byte(provided), []byte(secret)) != 1 {
			common.Fail(c, common.Unauthorized("invalid internal secret"))
			c.Abort()
			return
		}
		c.Next()
	}
}
