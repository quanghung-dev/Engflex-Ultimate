package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger writes one structured record per request after the handler
// chain returns. Request-scoped attributes (request_id, user_id) come from
// the context through the logger's handler, so they need no restating here.
// Health and swagger traffic is skipped to keep logs signal-heavy.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		path := c.Request.URL.Path
		if shouldSkipRequestLog(path) {
			return
		}

		attrs := []any{
			"method", c.Request.Method,
			"path", path,
			"status", c.Writer.Status(),
			"duration_ms", float64(time.Since(start).Microseconds()) / 1000,
			"client_ip", c.ClientIP(),
			"size", c.Writer.Size(),
		}
		if errs := c.Errors.String(); errs != "" {
			attrs = append(attrs, "errors", errs)
		}

		level := slog.LevelInfo
		switch {
		case c.Writer.Status() >= http.StatusInternalServerError:
			level = slog.LevelError
		case c.Writer.Status() >= http.StatusBadRequest:
			level = slog.LevelWarn
		}
		slog.Log(c.Request.Context(), level, "http request", attrs...)
	}
}

func shouldSkipRequestLog(path string) bool {
	return path == "/healthz" || strings.HasPrefix(path, "/swagger/")
}
