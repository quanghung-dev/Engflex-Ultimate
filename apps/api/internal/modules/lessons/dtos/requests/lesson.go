package requests

type CreateLesson struct {
	CategoryID   *uint   `json:"category_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	VideoURL     string  `json:"video_url"`
	YoutubeURL   string  `json:"youtube_url"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Level        string  `json:"level"`
	Duration     float64 `json:"duration"`
}

type UpdateLesson struct {
	CategoryID   *uint   `json:"category_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	VideoURL     string  `json:"video_url"`
	YoutubeURL   string  `json:"youtube_url"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Level        string  `json:"level"`
	Duration     float64 `json:"duration"`
}
