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

func (h *SelfAssessmentHandler) SubmitAssessmentAnswer(c *gin.Context) {
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
		AssessmentType: "behavioral",
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	sessionID := session.ID

	// Insert each answer
	for _, answer := range req.Answers {
		// Determine points based on answer value
		var points int = 0

		// Try to convert directly to a number
		if p, err := strconv.Atoi(answer.AnswerValue); err == nil {
			points = p
		} else {
			// Default points based on standard Likert scale
			switch answer.AnswerValue {
			case "1", "Strongly Disagree":
				points = 1
			case "2", "Disagree":
				points = 2
			case "3", "Neutral":
				points = 3
			case "4", "Agree":
				points = 4
			case "5", "Strongly Agree":
				points = 5
			default:
				points = 3 // Default to middle value
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

	// Calculate and store simple total score without using mappings
	err = h.queries.CalculateCategoryScores(c, pgtype.Int4{Int32: sessionID, Valid: true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to calculate scores: %v", err)})
		return
	}

	// Mark session as completed
	err = h.queries.CompleteAssessmentSession(c, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to complete session: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Assessment completed successfully",
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

func (h *SelfAssessmentHandler) GetSelfAssessmentPersonality(c *gin.Context) {
	questions, err := h.queries.GetAssessmentQuestionPersonality(c)
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

// SetupBehavioralCategoriesAndMappings sets up categories and maps questions to them
func (h *SelfAssessmentHandler) SetupBehavioralCategoriesAndMappings(c *gin.Context) {
    mappings := map[string]string{
        // Adaptability Category
        "I remain calm and focused under pressure":           "Adaptability",
        "I am comfortable adapting to unexpected changes":    "Adaptability",
        "I remain positive even when facing challenges":      "Adaptability",
        
        // Communication Category
        "I carefully listen to others before responding":     "Communication",
        "I communicate my ideas clearly and effectively":     "Communication",
        "I make an effort to understand different perspectives": "Communication",
        
        // Leadership Category
        "I proactively take the lead when working on projects": "Leadership",
        "When facing a conflict, I try to resolve it diplomatically": "Leadership",
        "I can effectively multitask and handle multiple priorities": "Leadership",
        
        // Teamwork Category
        "I prefer working in a team rather than alone":        "Teamwork",
        "I encourage and support my colleagues in the workplace": "Teamwork",
        "I am open to constructive criticism and feedback":    "Teamwork",
        
        // Work Ethic Category
        "I always meet deadlines and manage my time effectively": "Work Ethic",
        "I take responsibility for my mistakes and learn from them": "Work Ethic",
        "I follow company policies and ethical guidelines strictly": "Work Ethic",
    }
    
    // Track successful and failed mappings
    successCount := 0
    failedMappings := []string{}
    
    // Apply each mapping
    for questionText, categoryName := range mappings {
        // Get question ID
        questionID, err := h.queries.GetQuestionIDByText(c, questionText)
        if err != nil {
            failedMappings = append(failedMappings, fmt.Sprintf("Question not found: %s", questionText))
            continue
        }
        
		// Get category ID - convert to pgtype.Text
        categoryNameParam := pgtype.Text{
            String: categoryName,
            Valid:  true,
        }

        // Get category ID
        categoryID, err := h.queries.GetCategoryIDByName(c, categoryNameParam)
        if err != nil {
            failedMappings = append(failedMappings, fmt.Sprintf("Category not found: %s", categoryName))
            continue
        }
        
        // Map question to category
        err = h.queries.MapQuestionToCategory(c, MapQuestionToCategoryParams{
            QuestionID: questionID,
            CategoryID: categoryID,
        })
        
        if err != nil {
            failedMappings = append(failedMappings, fmt.Sprintf("Failed to map '%s' to '%s': %v", questionText, categoryName, err))
        } else {
            successCount++
        }
    }
    
    response := gin.H{
        "message": "Behavioral categories and mappings setup completed",
        "mappings_succeeded": successCount,
        "mappings_total": len(mappings),
    }
    
    if len(failedMappings) > 0 {
        response["failed_mappings"] = failedMappings
    }
    
    c.JSON(http.StatusOK, response)
}

func (h *SelfAssessmentHandler) GetCandidateScores(c *gin.Context) {
    candidates, err := h.queries.ListCandidateScores(c)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch candidate scores"})
        return
    }

    c.JSON(http.StatusOK, candidates)
}

func (h *SelfAssessmentHandler) SubmitPersonalityAssessment(c *gin.Context) {
    var req struct {
        UserID  int32 `json:"user_id" binding:"required"`
        Answers []struct {
            QuestionID   int32  `json:"question_id" binding:"required"`
            AnswerValue  string `json:"answer_value" binding:"required"`
        } `json:"answers" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Create a new assessment session
    session, err := h.queries.CreateAssessmentSession(c, CreateAssessmentSessionParams{
        UserID:          req.UserID,
        AssessmentType:  "personality",
    })
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
        return
    }
    sessionID := session.ID

    // Insert each answer
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
            UserID:       pgtype.Int4{Int32: req.UserID, Valid: true},
            SessionID:    pgtype.Int4{Int32: sessionID, Valid: true},
            QuestionID:   pgtype.Int4{Int32: answer.QuestionID, Valid: true},
            AnswerValue:  answerBytes,
        })
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to insert answer: %v", err)})
            return
        }
    }

    // Calculate personality category scores
    err = h.queries.CalculatePersonalityScores(c, pgtype.Int4{Int32: sessionID, Valid: true})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to calculate scores: %v", err)})
        return
    }

    // Mark session as completed
    err = h.queries.CompleteAssessmentSession(c, sessionID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to complete session: %v", err)})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":     "Personality assessment completed successfully",
        "session_id":  sessionID,
    })
}