// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0

package self_assessment

import (
	"database/sql/driver"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

type QuestionType string

const (
	QuestionTypePersonality QuestionType = "personality"
	QuestionTypeCognitive   QuestionType = "cognitive"
	QuestionTypeBehavioral  QuestionType = "behavioral"
)

func (e *QuestionType) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = QuestionType(s)
	case string:
		*e = QuestionType(s)
	default:
		return fmt.Errorf("unsupported scan type for QuestionType: %T", src)
	}
	return nil
}

type NullQuestionType struct {
	QuestionType QuestionType
	Valid        bool // Valid is true if QuestionType is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullQuestionType) Scan(value interface{}) error {
	if value == nil {
		ns.QuestionType, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.QuestionType.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullQuestionType) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.QuestionType), nil
}

type SelfAssessmentCategory struct {
	ID          int32
	Name        pgtype.Text
	Description pgtype.Text
}

type SelfAssessmentMapping struct {
	ID          int32
	QuestionID  int32
	AnswerValue pgtype.Int4
	CategoryID  int32
	Points      pgtype.Int4
}

type SelfAssessmentQuestion struct {
	ID            int32
	Question      string
	Type          QuestionType
	Options       []byte
	CorrectAnswer pgtype.Text
	CreatedAt     pgtype.Timestamp
}

type User struct {
	ID        int32
	RoleID    pgtype.Int4
	Name      string
	Email     string
	Password  string
	CreatedAt pgtype.Timestamp
}

type UserAnswer struct {
	ID          int32
	UserID      pgtype.Int4
	SessionID   pgtype.Int4
	QuestionID  pgtype.Int4
	AnswerValue []byte
}

type UserAssessmentScore struct {
	ID         int32
	UserID     pgtype.Int4
	SessionID  pgtype.Int4
	CategoryID pgtype.Int4
	Score      pgtype.Int4
}

type UserAssessmentSession struct {
	ID             int32
	UserID         int32
	AssessmentType string
	StartedAt      pgtype.Timestamp
	CompletedAt    pgtype.Timestamp
}
