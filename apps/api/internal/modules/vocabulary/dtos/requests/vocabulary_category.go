package requests

type CreateVocabularyCategory struct {
	Name        string `json:"name" binding:"required,max=100"`
	Description string `json:"description"`
}

type UpdateVocabularyCategory struct {
	Name        *string `json:"name" binding:"omitempty,max=100"`
	Description *string `json:"description"`
}
