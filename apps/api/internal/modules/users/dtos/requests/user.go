package requests

type UpsertUser struct {
	ID        string `json:"id" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}
