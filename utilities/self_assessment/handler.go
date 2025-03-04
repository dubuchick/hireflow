package self_assessment

import (
	"encoding/json"
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

func (h *SelfAssessmentHandler) SubmitAssessmentAnswer(c *gin.Context) {
    var req struct {
        UserID    int32 `json:"user_id" binding:"required"`
        Answers   []struct {
            QuestionID  int32 `json:"question_id" binding:"required"`
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
        AssessmentType: "behavioral",
    })
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
        return
    }
    
    sessionID := session.ID
    
    // Insert each answer
    for _, answer := range req.Answers {
        // Create answer JSONB structure
        answerJSON := map[string]interface{}{
            "selected": answer.AnswerValue,
        }
        
        // Convert the answer to a format that matches your schema
        answerBytes, err := json.Marshal(answerJSON)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process answer"})
            return
        }
        
        err = h.queries.InsertUserAnswer(c, InsertUserAnswerParams{
            UserID:      pgtype.Int4{Int32: req.UserID, Valid: true},
            SessionID:   pgtype.Int4{Int32: sessionID, Valid: true}, // Use the newly created session ID
            QuestionID:  pgtype.Int4{Int32: answer.QuestionID, Valid: true},
            AnswerValue: answerBytes,
        })
        
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert answer"})
            return
        }
    }
    
	// Convert sessionID to the correct type
    sessionParam := pgtype.Int4{Int32: sessionID, Valid: true}
    
    // Calculate scores
    err = h.queries.CalculateUserScores(c, sessionParam)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate scores"})
        return
    }
    
    // Mark session as completed
    err = h.queries.CompleteAssessmentSession(c, sessionID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete session"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "message": "Assessment completed successfully",
        "session_id": sessionID,
    })
}

func (h *SelfAssessmentHandler) GetSelfAssessmentBehavioral(c *gin.Context) {
	questions, err := h.queries.GetAssessmentQuestionBehavioral(c)
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
    
    // Define the SQLC query (you'll need to add this to your .sql file)
    // -- name: GetUserCompletedAssessments :many
    // SELECT assessment_type, completed_at 
    // FROM user_assessment_session
    // WHERE user_id = $1 AND completed_at IS NOT NULL;
    
    completedAssessments, err := h.queries.GetUserCompletedAssessments(c, int32(userID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assessment status"})
        return
    }
    
    // Create a map to track which assessments are completed
    assessmentStatus := map[string]bool{
        "behavioral": false,
        "cognitive": false,
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