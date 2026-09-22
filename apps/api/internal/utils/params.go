package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/gianghp123/engflex-ultimate/internal/common"
)

// ParsePagination reads ?page= & ?pageSize= (1-based), falling back to
// defaults and clamping pageSize to common.MaxPageSize.
func ParsePagination(c *gin.Context) (page, pageSize int) {
	page = parsePositiveInt(c.Query("page"), common.DefaultPage)
	pageSize = parsePositiveInt(c.Query("pageSize"), common.DefaultPageSize)
	if pageSize > common.MaxPageSize {
		pageSize = common.MaxPageSize
	}
	return page, pageSize
}

// Offset converts 1-based page/pageSize into a SQL offset.
func Offset(page, pageSize int) int {
	return (page - 1) * pageSize
}

func parsePositiveInt(raw string, fallback int) int {
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 {
		return fallback
	}
	return n
}
