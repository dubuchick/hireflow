package self_assessment

import (
	"backend/app/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutesSelfAssessment(r *gin.Engine, selfAssessmentHandler *SelfAssessmentHandler) {
	auth := r.Group("self-assessment")
	auth.Use(middleware.AuthMiddleware())
	auth.POST("/category", selfAssessmentHandler.InsertCategory)
	auth.POST("/question", selfAssessmentHandler.InsertQuestion)
	auth.GET("/question/behavioral", selfAssessmentHandler.GetSelfAssessmentBehavioral)
	auth.POST("/submit/behavioral", selfAssessmentHandler.SubmitAssessmentAnswer)
	auth.GET("/status", selfAssessmentHandler.GetUserAssessmentStatus)
	auth.PUT("/mapping", selfAssessmentHandler.SetupBehavioralCategoriesAndMappings)
}
