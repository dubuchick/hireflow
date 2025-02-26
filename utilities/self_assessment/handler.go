package self_assessment

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type SelfAssessmentHandler struct {
	queries *Queries
}

func NewSelfAssessmentHandler(queries *Queries) *SelfAssessmentHandler {
	return &SelfAssessmentHandler{
		queries: queries,
	}
}

func (h *SelfAssessmentHandler) InsertQuestion(c *gin.Context) {
	var req struct {
		Question      string          `json:"question"`
		Type          string          `json:"type"`
		Options       json.RawMessage `json:"options"` // Accept JSON object
		CorrectAnswer string          `json:"correct_answer"`
	}

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert json.RawMessage to []byte for SQLC
	optionsBytes, err := json.Marshal(req.Options) // Convert JSON to []byte
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process options"})
		return
	}

	// Prepare SQLC parameters
	params := InsertQuestionParams{
		Question: req.Question,
		Type:     QuestionType(req.Type),
		Options:  optionsBytes, // Pass JSON as []byte
		CorrectAnswer: pgtype.Text{
			String: req.CorrectAnswer,
			Valid:  req.CorrectAnswer != "",
		},
	}

	question, err := h.queries.InsertQuestion(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, question)
}

func (h *SelfAssessmentHandler) InsertCategory(c *gin.Context) {
	var req InsertCategoryParams
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.queries.InsertCategory(c, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, category)
}

func (h *SelfAssessmentHandler) StartAssessmentSession(c *gin.Context) {
	var req CreateAssessmentSessionParams
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.queries.CreateAssessmentSession(c, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (h *SelfAssessmentHandler) SubmitAssessmentAnswer(c *gin.Context) {
	var req struct {
		UserID    int32 `json:"user_id" binding:"required"`
		SessionID int32 `json:"session_id" binding:"required"`
		Answers   []struct {
			QuestionID  int32 `json:"question_id" binding:"required"`
			AnswerValue int32 `json:"answer_value" binding:"required"`
		} `json:"answers" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	answersBytes, err := json.Marshal(req.Answers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process answers"})
		return
	}

	err = h.queries.InsertUserAnswer(c, InsertUserAnswerParams{
		UserID:      pgtype.Int4{Int32: req.UserID, Valid: true},
		SessionID:   pgtype.Int4{Int32: req.SessionID, Valid: true},
		AnswerValue: answersBytes, 
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert answers"})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (h *SelfAssessmentHandler) GetSelfAssessmentBehavioral(c *gin.Context){
	questions, err := h.queries.GetAssessmentQuestionBehavioral(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get questions"})
		return
	}

	c.JSON(http.StatusOK, questions)
}