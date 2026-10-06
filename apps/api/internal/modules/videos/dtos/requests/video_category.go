package requests

type CreateVideoCategory struct {
	Slug string `json:"slug" binding:"required"`
	Name string `json:"name" binding:"required"`
}

type UpdateVideoCategory struct {
	Slug string `json:"slug" binding:"required"`
	Name string `json:"name" binding:"required"`
}
