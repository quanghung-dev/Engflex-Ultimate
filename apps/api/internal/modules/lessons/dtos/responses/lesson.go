package responses

type LessonResponse struct {
	ID           uint    `json:"id"`
	CategoryID   *uint   `json:"category_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	VideoURL     string  `json:"video_url"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Level        string  `json:"level"`
	Duration     float64 `json:"duration"`
	CreatedAt    string  `json:"created_at"`
}
