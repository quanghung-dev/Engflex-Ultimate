package utils

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
)

// Slugify derives a URL-safe slug from free text: lowercase alphanumerics,
// everything else collapsed to dashes, with leading/trailing dashes trimmed.
func Slugify(text string) string {
	slug := strings.ToLower(text)
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		return '-'
	}, slug)
	return strings.Trim(slug, "-")
}

// NewSuffixedSlug derives a URL slug from free text with a random hex suffix
// so it satisfies UNIQUE constraints without a retry loop.
func NewSuffixedSlug(text string) string {
	slug := Slugify(text)
	var suffix [3]byte
	if _, err := rand.Read(suffix[:]); err != nil {
		return slug
	}
	return slug + "-" + hex.EncodeToString(suffix[:])
}
