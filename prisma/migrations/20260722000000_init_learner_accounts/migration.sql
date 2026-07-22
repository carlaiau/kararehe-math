BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  birth_month smallint CHECK (birth_month IS NULL OR birth_month BETWEEN 1 AND 12),
  birth_year smallint CHECK (birth_year IS NULL OR birth_year BETWEEN 2000 AND EXTRACT(YEAR FROM CURRENT_DATE)::smallint),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learner_settings (
  learner_profile_id uuid PRIMARY KEY REFERENCES public.learner_profiles(id) ON DELETE CASCADE,
  show_english boolean NOT NULL DEFAULT true,
  show_maori boolean NOT NULL DEFAULT true,
  question_presentation text NOT NULL DEFAULT 'numbers' CHECK (question_presentation IN ('numbers', 'english-words', 'maori-words')),
  session_length smallint NOT NULL DEFAULT 10 CHECK (session_length IN (10, 20, 30)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_sessions (
  id uuid PRIMARY KEY,
  learner_profile_id uuid NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 3),
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  status text NOT NULL CHECK (status IN ('in_progress', 'complete', 'incomplete')),
  questions_completed smallint NOT NULL DEFAULT 0 CHECK (questions_completed >= 0),
  total_questions smallint NOT NULL CHECK (total_questions IN (10, 20, 30)),
  app_version text NOT NULL,
  schema_version smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.question_attempts (
  id uuid PRIMARY KEY,
  learner_profile_id uuid NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 3),
  skill text NOT NULL,
  item_key text NOT NULL,
  animal text NOT NULL,
  operands integer[] NOT NULL,
  expected_answer integer NOT NULL,
  submitted_answers integer[] NOT NULL DEFAULT '{}',
  partition_submitted_answers integer[] NOT NULL DEFAULT '{}',
  partition_correct_first_try boolean,
  sum_correct_first_try boolean,
  correct_first_try boolean NOT NULL,
  hints_used smallint NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  active_duration_ms integer NOT NULL CHECK (active_duration_ms BETWEEN 0 AND 300000),
  legacy_response_ms integer NOT NULL CHECK (legacy_response_ms >= 0),
  payload jsonb NOT NULL,
  app_version text NOT NULL,
  schema_version smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX learning_sessions_profile_started_idx ON public.learning_sessions (learner_profile_id, started_at DESC);
CREATE INDEX question_attempts_profile_occurred_idx ON public.question_attempts (learner_profile_id, occurred_at DESC);
CREATE INDEX question_attempts_session_idx ON public.question_attempts (session_id);

ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY learner_profiles_owner_all ON public.learner_profiles FOR ALL TO authenticated
  USING (auth.user_id() = auth_user_id) WITH CHECK (auth.user_id() = auth_user_id);

CREATE POLICY learner_settings_owner_all ON public.learner_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learner_profiles p WHERE p.id = learner_settings.learner_profile_id AND p.auth_user_id = auth.user_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learner_profiles p WHERE p.id = learner_settings.learner_profile_id AND p.auth_user_id = auth.user_id()));

CREATE POLICY learning_sessions_owner_all ON public.learning_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learner_profiles p WHERE p.id = learning_sessions.learner_profile_id AND p.auth_user_id = auth.user_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learner_profiles p WHERE p.id = learning_sessions.learner_profile_id AND p.auth_user_id = auth.user_id()));

CREATE POLICY question_attempts_owner_all ON public.question_attempts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learner_profiles p WHERE p.id = question_attempts.learner_profile_id AND p.auth_user_id = auth.user_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learner_profiles p WHERE p.id = question_attempts.learner_profile_id AND p.auth_user_id = auth.user_id()));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_profiles, public.learner_settings, public.learning_sessions, public.question_attempts TO authenticated;

COMMIT;
