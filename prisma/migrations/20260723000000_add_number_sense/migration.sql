-- Stable level identifiers allow new categories to be inserted without changing
-- the meaning of historical numeric Levels 1–3.
ALTER TABLE public.learning_sessions ADD COLUMN level_id text;
ALTER TABLE public.question_attempts ADD COLUMN level_id text;

UPDATE public.learning_sessions
SET level_id = CASE level
  WHEN 1 THEN 'make-10'
  WHEN 2 THEN 'teen-numbers'
  WHEN 3 THEN 'bridge-through-10'
END;

UPDATE public.question_attempts
SET level_id = CASE level
  WHEN 1 THEN 'make-10'
  WHEN 2 THEN 'teen-numbers'
  WHEN 3 THEN 'bridge-through-10'
END;

ALTER TABLE public.learning_sessions ALTER COLUMN level_id SET NOT NULL;
ALTER TABLE public.question_attempts ALTER COLUMN level_id SET NOT NULL;
ALTER TABLE public.learning_sessions ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.question_attempts ALTER COLUMN level DROP NOT NULL;

ALTER TABLE public.learning_sessions DROP CONSTRAINT IF EXISTS learning_sessions_level_check;
ALTER TABLE public.question_attempts DROP CONSTRAINT IF EXISTS question_attempts_level_check;
ALTER TABLE public.learning_sessions ADD CONSTRAINT learning_sessions_level_id_check CHECK (level_id IN (
  'count-objects', 'subitise-small-groups', 'compare-quantities',
  'make-10', 'teen-numbers', 'bridge-through-10'
));
ALTER TABLE public.question_attempts ADD CONSTRAINT question_attempts_level_id_check CHECK (level_id IN (
  'count-objects', 'subitise-small-groups', 'compare-quantities',
  'make-10', 'teen-numbers', 'bridge-through-10'
));

ALTER TABLE public.learner_settings
  ADD COLUMN number_sense_session_length smallint NOT NULL DEFAULT 8
  CHECK (number_sense_session_length IN (5, 8, 10));

ALTER TABLE public.learning_sessions DROP CONSTRAINT IF EXISTS learning_sessions_total_questions_check;
ALTER TABLE public.learning_sessions ADD CONSTRAINT learning_sessions_total_questions_check
  CHECK (total_questions IN (5, 8, 10, 20, 30));

CREATE INDEX learning_sessions_profile_level_idx
  ON public.learning_sessions (learner_profile_id, level_id, started_at DESC);
CREATE INDEX question_attempts_profile_level_idx
  ON public.question_attempts (learner_profile_id, level_id, occurred_at DESC);
