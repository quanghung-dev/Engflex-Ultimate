package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"

	"github.com/gianghp123/engflex-ultimate/internal/common"
)

// Recovery replaces gin.Recovery: panics are logged with their stack through
// slog, and clients get the shared {message} envelope like any other
// failure.
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			rec := recover()
			if rec == nil {
				return
			}
			// The stdlib (and http.Server) uses ErrAbortHandler to abort a
			// response deliberately; it carries no diagnostic value.
			if rec == http.ErrAbortHandler {
				panic(rec)
			}
			slog.ErrorContext(c.Request.Context(), "panic recovered",
				"panic", rec,
				"method", c.Request.Method,
				"path", c.Request.URL.Path,
				"stack", string(debug.Stack()),
			)
			common.Fail(c, common.Internal())
			c.Abort()
		}()
		c.Next()
	}
}
