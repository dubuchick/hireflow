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

-- name: GetAssessmentQuestionBehavioral :many
SELECT * from self_assessment_questions
where type = 'behavioral';

-- name: GetAssessmentQuestionPersonality :many
SELECT * from self_assessment_questions
where type = 'personality';

-- name: GetAssessmentQuestionCognitive :many
SELECT * from self_assessment_questions
where type = 'cognitive';

-- name: GetUserCompletedAssessments :many
SELECT assessment_type, completed_at 
FROM user_assessment_sessions
WHERE user_id = $1 AND completed_at IS NOT NULL;

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


-- name: CompleteAssessmentSession :exec
-- Mark a session as completed
UPDATE user_assessment_sessions
SET completed_at = CURRENT_TIMESTAMP
WHERE id = $1 AND completed_at IS NULL;

-- name: CalculateBehavioralScores :exec
-- Calculate scores for behavioral assessment type
WITH answers AS (
  SELECT 
    ua.session_id, 
    ua.question_id,
    (ua.answer_value->>'points')::int as points,
    sam.category_id
  FROM user_answers ua
  JOIN self_assessment_mappings sam ON 
    sam.question_id = ua.question_id AND 
    sam.answer_value = (ua.answer_value->>'selected')::int
  JOIN user_assessment_sessions uas ON 
    uas.id = ua.session_id
  WHERE 
    ua.session_id = $1 AND
    uas.assessment_type = 'behavioral'
)
INSERT INTO user_assessment_scores (
  user_id,
  session_id,
  category_id,
  score
)
SELECT 
  (SELECT user_id FROM user_assessment_sessions WHERE id = $1),
  $1,
  a.category_id,
  SUM(a.points)
FROM answers a
GROUP BY a.category_id;

-- name: CalculatePersonalityScores :exec
-- Calculate scores for personality assessment type
WITH answers AS (
  SELECT 
    ua.session_id, 
    ua.question_id,
    (ua.answer_value->>'points')::int as points,
    sam.category_id
  FROM user_answers ua
  JOIN self_assessment_mappings sam ON 
    sam.question_id = ua.question_id AND 
    sam.answer_value = (ua.answer_value->>'selected')::int
  JOIN user_assessment_sessions uas ON 
    uas.id = ua.session_id
  WHERE 
    ua.session_id = $1 AND
    uas.assessment_type = 'personality'
)
INSERT INTO user_assessment_scores (
  user_id,
  session_id,
  category_id,
  score
)
SELECT 
  (SELECT user_id FROM user_assessment_sessions WHERE id = $1),
  $1,
  a.category_id,
  SUM(a.points)
FROM answers a
GROUP BY a.category_id;

-- name: GetSessionScores :many
-- Get all scores for a specific session with category details
SELECT 
  uas.*,
  sac.name as category_name,
  sac.description as category_description
FROM user_assessment_scores uas
JOIN self_assessment_categories sac ON uas.category_id = sac.id
WHERE uas.session_id = $1;

-- name: GetCandidateAssessmentResults :many
SELECT 
  uas.id,
  uas.user_id,
  uas.session_id,
  uas.category_id,
  uas.score,
  sac.name as category_name,
  sac.description as category_description,
  sess.started_at as assessment_date,
  sess.assessment_type
FROM user_assessment_scores uas
JOIN self_assessment_categories sac ON uas.category_id = sac.id
JOIN user_assessment_sessions sess ON uas.session_id = sess.id
WHERE 
  uas.user_id = $1 AND
  sess.assessment_type = $2
ORDER BY sac.name;

-- name: CalculateCognitiveScores :exec
-- Calculate scores for cognitive assessment type
WITH answers AS (
  SELECT 
    ua.session_id, 
    ua.question_id,
    (ua.answer_value->>'selected')::int as selected_answer,
    sam.answer_value as correct_answer,
    CASE 
      WHEN (ua.answer_value->>'selected')::int = sam.answer_value THEN sam.points
      ELSE 0
    END as points,
    sam.category_id
  FROM user_answers ua
  JOIN self_assessment_mappings sam ON 
    sam.question_id = ua.question_id
  JOIN user_assessment_sessions uas ON 
    uas.id = ua.session_id
  WHERE 
    ua.session_id = $1 AND
    uas.assessment_type = 'cognitive'
)
INSERT INTO user_assessment_scores (
  user_id,
  session_id,
  category_id,
  score
)
SELECT 
  (SELECT user_id FROM user_assessment_sessions WHERE id = $1),
  $1,
  a.category_id,
  SUM(a.points)
FROM answers a
GROUP BY a.category_id;