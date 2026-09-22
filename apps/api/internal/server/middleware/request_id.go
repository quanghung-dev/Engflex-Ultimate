package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/gianghp123/engflex-ultimate/internal/logger"
)

// RequestIDHeader is the request/response correlation header.
const RequestIDHeader = "X-Request-ID"

// RequestID honors an incoming X-Request-ID (so upstream proxies can
// correlate) or generates one, echoes it on the response, and stores it in
// the request context so every log record carries request_id.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader(RequestIDHeader)
		if requestID == "" {
			requestID = uuid.NewString()
		}
		c.Header(RequestIDHeader, requestID)
		c.Request = c.Request.WithContext(
			logger.WithRequestID(c.Request.Context(), requestID),
		)
		c.Next()
	}
}
