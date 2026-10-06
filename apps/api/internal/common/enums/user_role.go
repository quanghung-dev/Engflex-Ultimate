package enums

// UserRole is the caller's role (Clerk public-metadata `role` claim).
// Admin gates whole endpoints via middleware.RequireAdmin; ownership checks
// stay per-service and owner-only until a shared route needs a bypass.
type UserRole string

const (
	UserRoleAdmin UserRole = "admin"
	UserRoleUser  UserRole = "user"
)
