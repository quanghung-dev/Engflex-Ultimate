package requests

type CreateCategory struct {
	Name string `json:"name" binding:"required,max=100"`
}

type UpdateCategory struct {
	Name string `json:"name" binding:"required,max=100"`
}
