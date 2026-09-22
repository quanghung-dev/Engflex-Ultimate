package utils

// Ptr returns a pointer to v. Useful for building optional request fields
// without a temporary variable.
func Ptr[T any](v T) *T {
	return &v
}

// DerefOr returns the value pointed to by p, or fallback when p is nil.
func DerefOr[T any](p *T, fallback T) T {
	if p == nil {
		return fallback
	}
	return *p
}

// DerefOrZero returns the value pointed to by p, or the zero value of T
// when p is nil.
func DerefOrZero[T any](p *T) T {
	var zero T
	return DerefOr(p, zero)
}
