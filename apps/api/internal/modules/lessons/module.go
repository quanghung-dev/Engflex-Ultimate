// Package lessons wires the curriculum module: lessons, their categories,
// ordered activities, and the caller's bookmarks. Attempts stay outside.
package lessons

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/lessons/controllers"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/server/middleware"
)

// RegisterRoutes mounts the lesson endpoints under /api/v1.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	categorySvc := services.NewLessonCategoryService(repositories.NewLessonCategoryRepository(db))
	categoryCtl := controllers.NewLessonCategoryController(categorySvc)

	lessonSvc := services.NewLessonService(repositories.NewLessonRepository(db), categorySvc)
	lessonCtl := controllers.NewLessonController(lessonSvc)

	activitySvc := services.NewLessonActivityService(repositories.NewLessonActivityRepository(db))
	activityCtl := controllers.NewLessonActivityController(activitySvc)

	bookmarkSvc := services.NewLessonBookmarkService(repositories.NewLessonBookmarkRepository(db))
	bookmarkCtl := controllers.NewLessonBookmarkController(bookmarkSvc)

	l := rg.Group("/lessons")
	l.GET("", middleware.RequireAuth(), lessonCtl.List)
	l.GET("/:id", middleware.RequireAuth(), lessonCtl.GetByID)

	lc := rg.Group("/lesson-categories")
	lc.GET("", middleware.RequireAuth(), categoryCtl.List)
	lc.GET("/:id", middleware.RequireAuth(), categoryCtl.GetByID)

	la := rg.Group("/lesson-activities")
	la.GET("", middleware.RequireAuth(), activityCtl.List)
	la.GET("/:id", middleware.RequireAuth(), activityCtl.GetByID)

	lb := rg.Group("/lesson-bookmarks")
	lb.GET("", middleware.RequireAuth(), bookmarkCtl.List)
	lb.POST("", middleware.RequireAuth(), bookmarkCtl.Save)
	lb.DELETE("/:lessonId", middleware.RequireAuth(), bookmarkCtl.Unsave)
}
