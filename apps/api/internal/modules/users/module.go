package users

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/users/controllers"
	"engflex-api/internal/modules/users/services"
)

func RegisterRoutes(rg *gin.RouterGroup, repo repositories.UserRepository) {
	svc := services.NewUserService(repo)
	ctl := controllers.NewUserController(svc)

	g := rg.Group("/users")
	{
		g.GET("/:id", ctl.GetByID)
		g.POST("", ctl.UpSert)
	}
}
