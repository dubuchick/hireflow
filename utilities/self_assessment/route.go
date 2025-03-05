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
	auth.GET("/question/cognitive", selfAssessmentHandler.GetSelfAssessmentCognitive)
	auth.GET("/status", selfAssessmentHandler.GetUserAssessmentStatus)
	auth.GET("/candidate/scores", selfAssessmentHandler.GetCandidateScores)

	// Submit Assessment
	auth.POST("/submit/:type", selfAssessmentHandler.SubmitAssessment)

	// Candidate Details
	auth.POST("/candidate/details", selfAssessmentHandler.GetCandidateAssessmentDetails)
}
