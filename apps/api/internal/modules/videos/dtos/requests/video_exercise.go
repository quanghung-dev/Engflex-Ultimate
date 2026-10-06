package requests

import "engflex-api/internal/common/enums"

type CreateVideoExercise struct {
	CategoryID   *string     `json:"categoryId" binding:"omitempty,uuid"`
	Title        string      `json:"title"`
	Description  string      `json:"description"`
	VideoURL     string      `json:"videoUrl"`
	YoutubeURL   string      `json:"youtubeUrl"`
	ThumbnailURL string      `json:"thumbnailUrl"`
	CEFRLevel    *enums.CEFR `json:"cefrLevel" binding:"omitempty,oneof=A1 A2 B1 B2 C1 C2"`
	Duration     float64     `json:"duration"`
}

type UpdateVideoExercise struct {
	CategoryID   *string     `json:"categoryId" binding:"omitempty,uuid"`
	Title        string      `json:"title"`
	Description  string      `json:"description"`
	VideoURL     string      `json:"videoUrl"`
	YoutubeURL   string      `json:"youtubeUrl"`
	ThumbnailURL string      `json:"thumbnailUrl"`
	CEFRLevel    *enums.CEFR `json:"cefrLevel" binding:"omitempty,oneof=A1 A2 B1 B2 C1 C2"`
	Duration     float64     `json:"duration"`
}
