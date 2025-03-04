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
INSERT INTO user_answers (
    user_id, session_id, question_id, answer_value
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

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

-- name: GetUserBehavioralAssessmentSession :one
SELECT uas.id 
FROM user_assessment_sessions uas
WHERE uas.user_id = $1 AND uas.assessment_type = 'behavioral'
LIMIT 1;

-- name: GetUserCompletedAssessments :many
SELECT assessment_type, completed_at 
FROM user_assessment_sessions
WHERE user_id = $1 AND completed_at IS NOT NULL;

-- name: CalculateCategoryScores :exec
/* Calculates scores by category using mappings */
WITH answer_points AS (
-- Join user answers with mappings to get points for each answer
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
-- Calculate average score per category
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
-- Insert category scores
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
FROM category_scores;


-- name: MapQuestionToCategory :exec
/* Maps a question to a category using question ID and category ID */
INSERT INTO self_assessment_mappings (question_id, answer_value, category_id, points)
VALUES 
  ($1, 1, $2, 1),
  ($1, 2, $2, 2),
  ($1, 3, $2, 3),
  ($1, 4, $2, 4),
  ($1, 5, $2, 5)
ON CONFLICT DO NOTHING;

-- name: GetQuestionIDByText :one
/* Gets a question ID by its text */
SELECT id FROM self_assessment_questions 
WHERE question = $1 
LIMIT 1;

-- name: GetCategoryIDByName :one
SELECT id FROM self_assessment_categories 
WHERE name = $1 
LIMIT 1;

-- name: ListCandidateScores :many
WITH user_category_scores AS (
  SELECT 
    user_id,
    session_id,
    category_id,
    score,
    sac.name AS category_name
  FROM 
    user_assessment_scores uas
  JOIN 
    self_assessment_categories sac ON uas.category_id = sac.id
),
candidate_behavioral_scores AS (
  SELECT 
    user_id,
    session_id,
    category_id,
    category_name,
    score,
    RANK() OVER (PARTITION BY user_id ORDER BY score DESC) as score_rank
  FROM 
    user_category_scores
)

SELECT 
  user_id,
  session_id,
  category_name AS top_behavioral_trait,
  score AS top_behavioral_score,
  CASE 
    WHEN COUNT(category_name) OVER (PARTITION BY user_id) > 0 
    THEN 'In Progress'
    ELSE 'Not Started'
  END AS assessment_status
FROM 
  candidate_behavioral_scores
WHERE 
  score_rank = 1
ORDER BY 
  user_id;