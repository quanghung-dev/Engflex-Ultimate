package common

// RequireOwner enforces row ownership with existence-masking: any mismatch
// (including an empty caller) reads as NotFound so callers cannot probe for
// other users' row IDs. Admin bypass is deliberately absent — admin gates
// whole endpoints at the route layer (middleware.RequireAdmin), and no
// shared user/admin route exists yet.
func RequireOwner(ownerUserID, callerUserID, resource string) *AppError {
	if callerUserID != "" && callerUserID == ownerUserID {
		return nil
	}
	return NotFound(resource + " not found")
}
