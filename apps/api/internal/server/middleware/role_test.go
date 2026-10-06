package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"engflex-api/internal/common/enums"
)

func TestParseRole(t *testing.T) {
	tests := []struct {
		name  string
		claim string
		want  enums.UserRole
	}{
		{name: "admin", claim: "admin", want: enums.UserRoleAdmin},
		{name: "user", claim: "user", want: enums.UserRoleUser},
		{name: "empty defaults to user", claim: "", want: enums.UserRoleUser},
		{name: "unknown defaults to user", claim: "superadmin", want: enums.UserRoleUser},
		{name: "case-sensitive", claim: "ADMIN", want: enums.UserRoleUser},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, parseRole(tt.claim))
		})
	}
}

func TestRoleDefaultsClosed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	assert.Equal(t, enums.UserRoleUser, Role(c))
}

func TestRoleFromClaims(t *testing.T) {
	// Token-shape contract: the role comes from a TOP-LEVEL "role" claim
	// (Clerk Dashboard → Sessions → Customize session token:
	// {"role": "{{user.public_metadata.role}}"). The nested
	// {"metadata": {"role": ...}} shape from Clerk's canonical RBAC guide is
	// deliberately NOT honored — parseRole allowlists exact "admin" only.
	adminJSON := []byte(`{"role":"admin"}`)
	var adminClaims clerkRoleClaims
	assert.NoError(t, json.Unmarshal(adminJSON, &adminClaims))

	nestedJSON := []byte(`{"metadata":{"role":"admin"}}`)
	var nestedClaims clerkRoleClaims
	assert.NoError(t, json.Unmarshal(nestedJSON, &nestedClaims))

	tests := []struct {
		name   string
		custom any
		want   enums.UserRole
	}{
		{name: "documented token shape honored", custom: &adminClaims, want: enums.UserRoleAdmin},
		{name: "nested metadata shape ignored", custom: &nestedClaims, want: enums.UserRoleUser},
		{name: "nil custom fails closed", custom: nil, want: enums.UserRoleUser},
		{name: "wrong type fails closed", custom: "admin", want: enums.UserRoleUser},
		{name: "nil pointer fails closed", custom: (*clerkRoleClaims)(nil), want: enums.UserRoleUser},
		{name: "unknown role fails closed", custom: &clerkRoleClaims{Role: "superadmin"}, want: enums.UserRoleUser},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, roleFromClaims(tt.custom))
		})
	}
}

func TestRequireAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name       string
		seed       func(c *gin.Context)
		wantStatus int
		wantNext   bool
	}{
		{name: "admin passes", seed: func(c *gin.Context) { c.Set(roleKey, enums.UserRoleAdmin) }, wantStatus: http.StatusOK, wantNext: true},
		{name: "user blocked", seed: func(c *gin.Context) { c.Set(roleKey, enums.UserRoleUser) }, wantStatus: http.StatusForbidden, wantNext: false},
		{name: "missing key fails closed", seed: func(c *gin.Context) {}, wantStatus: http.StatusForbidden, wantNext: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			next := false
			r.GET("/admin",
				func(c *gin.Context) {
					tt.seed(c) // same c.Set(roleKey, ...) production uses
					c.Next()
				},
				RequireAdmin(),
				func(c *gin.Context) {
					next = true
					c.Status(http.StatusOK)
				},
			)
			req := httptest.NewRequest(http.MethodGet, "/admin", nil)
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, req)
			assert.Equal(t, tt.wantStatus, rec.Code)
			assert.Equal(t, tt.wantNext, next)
		})
	}
}
