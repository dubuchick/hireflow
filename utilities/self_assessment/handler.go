package self_assessment

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

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

func (h *SelfAssessmentHandler) GetSelfAssessmentBehavioral(c *gin.Context) {
	questions, err := h.queries.GetAssessmentQuestionBehavioral(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get questions"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

func (h *SelfAssessmentHandler) GetSelfAssessmentPersonality(c *gin.Context) {
	questions, err := h.queries.GetAssessmentQuestionPersonality(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get questions"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

func (h *SelfAssessmentHandler) GetSelfAssessmentCognitive(c *gin.Context) {
	questions, err := h.queries.GetAssessmentQuestionCognitive(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get questions"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

// GetUserAssessmentStatus checks if a user has completed assessments
func (h *SelfAssessmentHandler) GetUserAssessmentStatus(c *gin.Context) {
	// Get user ID from token
	userIDStr, exists := c.Get("userID") // Assuming this is set by your auth middleware
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := strconv.Atoi(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	completedAssessments, err := h.queries.GetUserCompletedAssessments(c, int32(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assessment status"})
		return
	}

	// Create a map to track which assessments are completed
	assessmentStatus := map[string]bool{
		"behavioral": false,
		"cognitive":  false,
		// Add other assessment types as needed
	}

	// Update the map based on database results
	for _, assessment := range completedAssessments {
		assessmentStatus[assessment.AssessmentType] = true
	}

	c.JSON(http.StatusOK, gin.H{
		"assessments_completed": assessmentStatus,
	})
}

func (h *SelfAssessmentHandler) GetCandidateScores(c *gin.Context) {
	candidates, err := h.queries.ListCandidateScores(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch candidate scores"})
		return
	}

	c.JSON(http.StatusOK, candidates)
}

// SubmitAssessment for all assessment types
func (h *SelfAssessmentHandler) SubmitAssessment(c *gin.Context) {
	// Get assessment type from path parameter
	assessmentType := c.Param("type")
	if assessmentType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Assessment type is required"})
		return
	}

	// Validate assessment type
	if assessmentType != "behavioral" && assessmentType != "personality" && assessmentType != "cognitive" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment type"})
		return
	}

	// Parse request
	var req struct {
		UserID  int32 `json:"user_id" binding:"required"`
		Answers []struct {
			QuestionID  int32  `json:"question_id" binding:"required"`
			AnswerValue string `json:"answer_value" binding:"required"`
		} `json:"answers" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create a new assessment session
	session, err := h.queries.CreateAssessmentSession(c, CreateAssessmentSessionParams{
		UserID:         req.UserID,
		AssessmentType: assessmentType,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}
	sessionID := session.ID

	// Replace your existing "Insert each answer" loop with this:
	if assessmentType == "cognitive" {
		// Special handling for cognitive answers
		for _, answer := range req.Answers {
			// For cognitive, convert answer to integer
			answerInt, err := strconv.Atoi(answer.AnswerValue)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid answer value format: %v", err)})
				return
			}

			// Create answer JSONB structure
			answerJSON := map[string]interface{}{
				"selected": answerInt, // Store as number (will be JSON number)
				"points":   0,         // Points will be calculated during scoring
			}

			// Convert to JSON
			answerBytes, err := json.Marshal(answerJSON)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process answer"})
				return
			}

			// Store the answer
			err = h.queries.InsertUserAnswer(c, InsertUserAnswerParams{
				UserID:      pgtype.Int4{Int32: req.UserID, Valid: true},
				SessionID:   pgtype.Int4{Int32: sessionID, Valid: true},
				QuestionID:  pgtype.Int4{Int32: answer.QuestionID, Valid: true},
				AnswerValue: answerBytes,
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to insert answer: %v", err)})
				return
			}
		}
	} else {
		// Your existing code for behavioral and personality assessments
		for _, answer := range req.Answers {
			// Determine points based on answer value
			var points int = 0
			// Try to convert directly to a number
			if p, err := strconv.Atoi(answer.AnswerValue); err == nil {
				points = p
			} else {
				// Default points based on standard options
				switch answer.AnswerValue {
				case "1":
					points = 1
				case "2":
					points = 2
				case "3":
					points = 3
				case "4":
					points = 4
				default:
					points = 2 // Default to middle value
				}
			}
			// Create answer JSONB structure
			answerJSON := map[string]interface{}{
				"selected": answer.AnswerValue,
				"points":   points,
			}
			// Convert to JSON
			answerBytes, err := json.Marshal(answerJSON)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process answer"})
				return
			}
			// Store the answer
			err = h.queries.InsertUserAnswer(c, InsertUserAnswerParams{
				UserID:      pgtype.Int4{Int32: req.UserID, Valid: true},
				SessionID:   pgtype.Int4{Int32: sessionID, Valid: true},
				QuestionID:  pgtype.Int4{Int32: answer.QuestionID, Valid: true},
				AnswerValue: answerBytes,
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to insert answer: %v", err)})
				return
			}
		}
	}
	// Calculate scores based on assessment type
	var calcErr error
	switch assessmentType {
	case "behavioral":
		calcErr = h.queries.CalculateBehavioralScores(c, pgtype.Int4{Int32: sessionID, Valid: true})
	case "personality":
		calcErr = h.queries.CalculatePersonalityScores(c, pgtype.Int4{Int32: sessionID, Valid: true})
	case "cognitive":
		calcErr = h.queries.CalculateCognitiveScores(c, pgtype.Int4{Int32: sessionID, Valid: true})
	}

	if calcErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to calculate scores: %v", calcErr)})
		return
	}

	// Mark session as completed
	err = h.queries.CompleteAssessmentSession(c, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to complete session: %v", err)})
		return
	}

	scores, err := h.queries.GetSessionScores(c, pgtype.Int4{Int32: sessionID, Valid: true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve scores"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    fmt.Sprintf("%s assessment completed successfully", assessmentType),
		"session_id": sessionID,
		"scores":     scores,
	})
}

// SubmitBehavioralAssessment - wrapper for backward compatibility
func (h *SelfAssessmentHandler) SubmitBehavioralAssessment(c *gin.Context) {
	c.Params = append(c.Params, gin.Param{Key: "type", Value: "behavioral"})
	h.SubmitAssessment(c)
}

// GetSessionScores returns scores for a specific session
func (h *SelfAssessmentHandler) GetSessionScores(c *gin.Context) {
	var req struct {
		SessionID int32 `json:"session_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	scores, err := h.queries.GetSessionScores(c, pgtype.Int4{Int32: req.SessionID, Valid: true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve scores"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id": req.SessionID,
		"scores":     scores,
	})
}

func (h *SelfAssessmentHandler) GetCandidateAssessmentDetails(c *gin.Context) {
	var req struct {
		UserID         int32  `json:"user_id" binding:"required"`
		AssessmentType string `json:"assessment_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and assessment type required"})
		return
	}

	// Create the params struct according to your SQLC-generated type
	params := GetCandidateAssessmentResultsParams{
		UserID:         pgtype.Int4{Int32: req.UserID, Valid: true},
		AssessmentType: req.AssessmentType,
	}

	results, err := h.queries.GetCandidateAssessmentResults(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve assessment details"})
		return
	}

	// Get the latest session if multiple exist
	var latestSessionID int32
	if len(results) > 0 {
		// Extract the Int32 value from the pgtype.Int4 field
		latestSessionID = results[0].SessionID.Int32
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":         req.UserID,
		"assessment_type": req.AssessmentType,
		"session_id":      latestSessionID,
		"results":         results,
	})
}
