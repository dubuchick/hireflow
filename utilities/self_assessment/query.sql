-- name: InsertCategory :one
INSERT INTO self_assessment_categories(
    name,
    description
)VALUES(
    $1,
    $2
) RETURNING *;

-- name: InsertQuestion :one
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
) RETURNING *;

-- name: InsertMapping :one
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
)RETURNING *;

-- name: CreateAssessmentSession :one
INSERT INTO user_assessment_sessions(
    user_id,
    assessment_type
)VALUES(
    $1, $2
)RETURNING *;

-- name: InsertUserAnswer :exec
INSERT INTO user_answers(
    user_id, session_id,question_id, answer_value
)VALUES(
    $1,$2,$3,$4
)RETURNING *;

-- name: CalculateUserScores :exec
INSERT INTO user_assessment_scores (user_id, session_id, category_id, score)
SELECT 
    ua.user_id,
    ua.session_id,
    sa.category_id,
    SUM(
        CASE 
            WHEN ua.answer_value ? 'numeric' THEN (ua.answer_value->>'numeric')::INT * sa.points
            WHEN ua.answer_value ? 'scale' THEN (ua.answer_value->>'scale')::INT * sa.points
            ELSE 0
        END
    ) AS total_score
FROM user_answers ua
JOIN self_assessment_mappings sa ON ua.question_id = sa.question_id
WHERE ua.session_id = $1
GROUP BY ua.user_id, ua.session_id, sa.category_id;

-- name: CompleteAssessmentSession :exec
UPDATE user_assessment_sessions
SET completed_at = NOW()
WHERE id = $1;

-- name: GetUserAssessmentSessions :many
SELECT * FROM user_assessment_sessions
where user_id = $1 ORDER BY started_at DESC;

-- name: GetUserAssessmentScores :many
SELECT c.name AS category, s.score
FROM user_assessment_scores s
JOIN self_assessment_categories c on s.category_id = c.id
WHERE s.session_id = $1;

-- name: GetUserAnswerBySession :many
SELECT question_id, answer_value
FROM user_answers 
WHERE session_id = $1;

-- name: GetAssessmentQuestionBehavioral :many
SELECT * from self_assessment_questions
where type = 'behavioral';