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
	auth.GET("/question/personality", selfAssessmentHandler.GetSelfAssessmentPersonality)
	auth.POST("/submit/behavioral", selfAssessmentHandler.SubmitAssessmentAnswer)
	auth.GET("/status", selfAssessmentHandler.GetUserAssessmentStatus)
	auth.PUT("/mapping", selfAssessmentHandler.SetupBehavioralCategoriesAndMappings)
	auth.GET("/candidate/scores", selfAssessmentHandler.GetCandidateScores)
	auth.POST("/submit/personality", selfAssessmentHandler.SubmitPersonalityAssessment)
}
