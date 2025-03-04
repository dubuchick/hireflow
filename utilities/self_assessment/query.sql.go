// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: query.sql

package self_assessment

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const calculateCategoryScores = `-- name: CalculateCategoryScores :exec
WITH answer_points AS (
SELECT
 ua.user_id,
 ua.session_id,
 sam.category_id,
 sam.points
FROM
 user_answers ua
JOIN
 self_assessment_mappings sam ON
 ua.question_id = sam.question_id AND
 (ua.answer_value->>'selected')::int = sam.answer_value
WHERE
 ua.session_id = $1
),
category_scores AS (
SELECT
 ap.user_id,
 ap.session_id,
 ap.category_id,
 ROUND(AVG(ap.points)::numeric, 2) AS avg_score,
 SUM(ap.points) AS total_points,
 COUNT(ap.points) AS question_count
FROM
 answer_points ap
GROUP BY
 ap.user_id, ap.session_id, ap.category_id
)
INSERT INTO user_assessment_scores (
 user_id,
 session_id,
 category_id,
 score
)
SELECT 
 user_id, 
 session_id, 
 category_id, 
 avg_score 
FROM category_scores
`

// Calculates scores by category using mappings
// Join user answers with mappings to get points for each answer
// Calculate average score per category
// Insert category scores
func (q *Queries) CalculateCategoryScores(ctx context.Context, sessionID pgtype.Int4) error {
	_, err := q.db.Exec(ctx, calculateCategoryScores, sessionID)
	return err
}

const completeAssessmentSession = `-- name: CompleteAssessmentSession :exec
UPDATE user_assessment_sessions
SET completed_at = NOW()
WHERE id = $1
`

func (q *Queries) CompleteAssessmentSession(ctx context.Context, id int32) error {
	_, err := q.db.Exec(ctx, completeAssessmentSession, id)
	return err
}

const createAssessmentSession = `-- name: CreateAssessmentSession :one
INSERT INTO user_assessment_sessions(
    user_id,
    assessment_type
)VALUES(
    $1, $2
)RETURNING id, user_id, assessment_type, started_at, completed_at
`

type CreateAssessmentSessionParams struct {
	UserID         int32
	AssessmentType string
}

func (q *Queries) CreateAssessmentSession(ctx context.Context, arg CreateAssessmentSessionParams) (UserAssessmentSession, error) {
	row := q.db.QueryRow(ctx, createAssessmentSession, arg.UserID, arg.AssessmentType)
	var i UserAssessmentSession
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.AssessmentType,
		&i.StartedAt,
		&i.CompletedAt,
	)
	return i, err
}

const getAssessmentQuestionBehavioral = `-- name: GetAssessmentQuestionBehavioral :many
SELECT id, question, type, options, correct_answer, created_at from self_assessment_questions
where type = 'behavioral'
`

func (q *Queries) GetAssessmentQuestionBehavioral(ctx context.Context) ([]SelfAssessmentQuestion, error) {
	rows, err := q.db.Query(ctx, getAssessmentQuestionBehavioral)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []SelfAssessmentQuestion
	for rows.Next() {
		var i SelfAssessmentQuestion
		if err := rows.Scan(
			&i.ID,
			&i.Question,
			&i.Type,
			&i.Options,
			&i.CorrectAnswer,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getCategoryIDByName = `-- name: GetCategoryIDByName :one
SELECT id FROM self_assessment_categories 
WHERE name = $1 
LIMIT 1
`

// Gets a category ID by its name
func (q *Queries) GetCategoryIDByName(ctx context.Context, name pgtype.Text) (int32, error) {
	row := q.db.QueryRow(ctx, getCategoryIDByName, name)
	var id int32
	err := row.Scan(&id)
	return id, err
}

const getQuestionIDByText = `-- name: GetQuestionIDByText :one
SELECT id FROM self_assessment_questions 
WHERE question = $1 
LIMIT 1
`

// Gets a question ID by its text
func (q *Queries) GetQuestionIDByText(ctx context.Context, question string) (int32, error) {
	row := q.db.QueryRow(ctx, getQuestionIDByText, question)
	var id int32
	err := row.Scan(&id)
	return id, err
}

const getUserAnswerBySession = `-- name: GetUserAnswerBySession :many
SELECT question_id, answer_value
FROM user_answers 
WHERE session_id = $1
`

type GetUserAnswerBySessionRow struct {
	QuestionID  pgtype.Int4
	AnswerValue []byte
}

func (q *Queries) GetUserAnswerBySession(ctx context.Context, sessionID pgtype.Int4) ([]GetUserAnswerBySessionRow, error) {
	rows, err := q.db.Query(ctx, getUserAnswerBySession, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetUserAnswerBySessionRow
	for rows.Next() {
		var i GetUserAnswerBySessionRow
		if err := rows.Scan(&i.QuestionID, &i.AnswerValue); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getUserAssessmentScores = `-- name: GetUserAssessmentScores :many
SELECT c.name AS category, s.score
FROM user_assessment_scores s
JOIN self_assessment_categories c on s.category_id = c.id
WHERE s.session_id = $1
`

type GetUserAssessmentScoresRow struct {
	Category pgtype.Text
	Score    pgtype.Int4
}

func (q *Queries) GetUserAssessmentScores(ctx context.Context, sessionID pgtype.Int4) ([]GetUserAssessmentScoresRow, error) {
	rows, err := q.db.Query(ctx, getUserAssessmentScores, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetUserAssessmentScoresRow
	for rows.Next() {
		var i GetUserAssessmentScoresRow
		if err := rows.Scan(&i.Category, &i.Score); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getUserAssessmentSessions = `-- name: GetUserAssessmentSessions :many
SELECT id, user_id, assessment_type, started_at, completed_at FROM user_assessment_sessions
where user_id = $1 ORDER BY started_at DESC
`

func (q *Queries) GetUserAssessmentSessions(ctx context.Context, userID int32) ([]UserAssessmentSession, error) {
	rows, err := q.db.Query(ctx, getUserAssessmentSessions, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []UserAssessmentSession
	for rows.Next() {
		var i UserAssessmentSession
		if err := rows.Scan(
			&i.ID,
			&i.UserID,
			&i.AssessmentType,
			&i.StartedAt,
			&i.CompletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getUserBehavioralAssessmentSession = `-- name: GetUserBehavioralAssessmentSession :one
SELECT uas.id 
FROM user_assessment_sessions uas
WHERE uas.user_id = $1 AND uas.assessment_type = 'behavioral'
LIMIT 1
`

func (q *Queries) GetUserBehavioralAssessmentSession(ctx context.Context, userID int32) (int32, error) {
	row := q.db.QueryRow(ctx, getUserBehavioralAssessmentSession, userID)
	var id int32
	err := row.Scan(&id)
	return id, err
}

const getUserCompletedAssessments = `-- name: GetUserCompletedAssessments :many
SELECT assessment_type, completed_at 
FROM user_assessment_sessions
WHERE user_id = $1 AND completed_at IS NOT NULL
`

type GetUserCompletedAssessmentsRow struct {
	AssessmentType string
	CompletedAt    pgtype.Timestamp
}

func (q *Queries) GetUserCompletedAssessments(ctx context.Context, userID int32) ([]GetUserCompletedAssessmentsRow, error) {
	rows, err := q.db.Query(ctx, getUserCompletedAssessments, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetUserCompletedAssessmentsRow
	for rows.Next() {
		var i GetUserCompletedAssessmentsRow
		if err := rows.Scan(&i.AssessmentType, &i.CompletedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const insertCategory = `-- name: InsertCategory :one
INSERT INTO self_assessment_categories(
    name,
    description
)VALUES(
    $1,
    $2
) RETURNING id, name, description
`

type InsertCategoryParams struct {
	Name        pgtype.Text
	Description pgtype.Text
}

func (q *Queries) InsertCategory(ctx context.Context, arg InsertCategoryParams) (SelfAssessmentCategory, error) {
	row := q.db.QueryRow(ctx, insertCategory, arg.Name, arg.Description)
	var i SelfAssessmentCategory
	err := row.Scan(&i.ID, &i.Name, &i.Description)
	return i, err
}

const insertMapping = `-- name: InsertMapping :one
INSERT INTO self_assessment_mappings(
    question_id,
    answer_value,
    category_id,
    points
)VALUES(
    $1,
    $2,
    $3,
    $4
)RETURNING id, question_id, answer_value, category_id, points
`

type InsertMappingParams struct {
	QuestionID  int32
	AnswerValue pgtype.Int4
	CategoryID  int32
	Points      pgtype.Int4
}

func (q *Queries) InsertMapping(ctx context.Context, arg InsertMappingParams) (SelfAssessmentMapping, error) {
	row := q.db.QueryRow(ctx, insertMapping,
		arg.QuestionID,
		arg.AnswerValue,
		arg.CategoryID,
		arg.Points,
	)
	var i SelfAssessmentMapping
	err := row.Scan(
		&i.ID,
		&i.QuestionID,
		&i.AnswerValue,
		&i.CategoryID,
		&i.Points,
	)
	return i, err
}

const insertQuestion = `-- name: InsertQuestion :one
INSERT INTO self_assessment_questions(
    question,
    type,
    options,
    correct_answer,
    created_at
)VALUES(
    $1,
    $2,
    $3,
    $4,
    CURRENT_TIMESTAMP
) RETURNING id, question, type, options, correct_answer, created_at
`

type InsertQuestionParams struct {
	Question      string
	Type          QuestionType
	Options       []byte
	CorrectAnswer pgtype.Text
}

func (q *Queries) InsertQuestion(ctx context.Context, arg InsertQuestionParams) (SelfAssessmentQuestion, error) {
	row := q.db.QueryRow(ctx, insertQuestion,
		arg.Question,
		arg.Type,
		arg.Options,
		arg.CorrectAnswer,
	)
	var i SelfAssessmentQuestion
	err := row.Scan(
		&i.ID,
		&i.Question,
		&i.Type,
		&i.Options,
		&i.CorrectAnswer,
		&i.CreatedAt,
	)
	return i, err
}

const insertUserAnswer = `-- name: InsertUserAnswer :exec
INSERT INTO user_answers (
    user_id, session_id, question_id, answer_value
) VALUES (
    $1, $2, $3, $4
) RETURNING id, user_id, session_id, question_id, answer_value
`

type InsertUserAnswerParams struct {
	UserID      pgtype.Int4
	SessionID   pgtype.Int4
	QuestionID  pgtype.Int4
	AnswerValue []byte
}

func (q *Queries) InsertUserAnswer(ctx context.Context, arg InsertUserAnswerParams) error {
	_, err := q.db.Exec(ctx, insertUserAnswer,
		arg.UserID,
		arg.SessionID,
		arg.QuestionID,
		arg.AnswerValue,
	)
	return err
}

const mapQuestionToCategory = `-- name: MapQuestionToCategory :exec
INSERT INTO self_assessment_mappings (question_id, answer_value, category_id, points)
VALUES 
  ($1, 1, $2, 1),
  ($1, 2, $2, 2),
  ($1, 3, $2, 3),
  ($1, 4, $2, 4),
  ($1, 5, $2, 5)
ON CONFLICT DO NOTHING
`

type MapQuestionToCategoryParams struct {
	QuestionID int32
	CategoryID int32
}

// Maps a question to a category using question ID and category ID
func (q *Queries) MapQuestionToCategory(ctx context.Context, arg MapQuestionToCategoryParams) error {
	_, err := q.db.Exec(ctx, mapQuestionToCategory, arg.QuestionID, arg.CategoryID)
	return err
}
