-- AGORA QUIZ — Supabase / Postgres schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- All access from the Next.js app goes through the service-role key on the
-- server only, so Row Level Security is enabled and locked down (no public
-- client-side access to these tables at all).

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =========================================================
-- PLATFORM SETTINGS (single row, key/value style for future growth)
-- =========================================================
create table if not exists platform_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into platform_settings (key, value) values
  ('whatsapp_channel_link', ''),
  ('contact_phone_number', '')
on conflict (key) do nothing;

-- =========================================================
-- ADMINS
-- =========================================================
create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password_hash text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed a single default administrator account. Username "admin",
-- temporary password "Columela" (bcrypt-hashed via pgcrypto, compatible
-- with bcryptjs used in the app). must_change_password forces a change
-- on first login, as required.
insert into admins (username, password_hash, must_change_password)
values ('admin', crypt('Columela', gen_salt('bf')), true)
on conflict (username) do nothing;

-- =========================================================
-- STUDENTS
-- =========================================================
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  username text unique not null,
  phone_number text not null,
  email text unique not null,
  password_hash text not null,
  has_seen_whatsapp_instructions boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_email on students (lower(email));
create index if not exists idx_students_username on students (lower(username));

-- =========================================================
-- SUBJECTS
-- =========================================================
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  created_at timestamptz not null default now()
);

insert into subjects (name) values
  ('Biology'), ('Chemistry'), ('Physics'), ('English'), ('Mathematics')
on conflict (name) do nothing;

-- =========================================================
-- QUIZZES
-- =========================================================
create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  description text,
  duration_minutes integer not null default 30,
  attempt_limit integer, -- null = unlimited
  results_visibility text not null default 'private' check (results_visibility in ('public','private')),
  explanations_visibility text not null default 'private' check (explanations_visibility in ('public','private')),
  leaderboard_visibility text not null default 'private' check (leaderboard_visibility in ('public','private')),
  status text not null default 'draft' check (status in ('draft','published','unpublished','archived')),
  shuffle_questions boolean not null default false,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quiz_subjects (
  quiz_id uuid references quizzes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  primary key (quiz_id, subject_id)
);

-- =========================================================
-- QUESTIONS
-- =========================================================
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('A','B','C','D')),
  explanation text,
  image_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_quiz on questions (quiz_id, order_index);

-- =========================================================
-- ATTEMPTS
-- =========================================================
create table if not exists attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  attempt_number integer not null default 1,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  score integer,
  total_questions integer,
  correct_count integer,
  incorrect_count integer,
  percentage numeric(6,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_attempts_quiz_student on attempts (quiz_id, student_id);

-- One row per answered question in an attempt, saved incrementally so a
-- page refresh never loses progress or resets the timer.
create table if not exists attempt_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_answer text check (selected_answer in ('A','B','C','D')),
  is_correct boolean,
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- =========================================================
-- ADMIN SESSIONS / STUDENT SESSIONS are handled via signed JWT cookies,
-- no session table required. (See src/lib/session.ts)
-- =========================================================

-- =========================================================
-- ROW LEVEL SECURITY
-- All tables are only ever touched by the server using the service-role
-- key, which bypasses RLS. We still enable RLS with no policies so that
-- the anon/public key (if ever exposed) cannot read or write anything.
-- =========================================================
alter table platform_settings enable row level security;
alter table admins enable row level security;
alter table students enable row level security;
alter table subjects enable row level security;
alter table quizzes enable row level security;
alter table quiz_subjects enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table attempt_answers enable row level security;

-- =========================================================
-- Helpful view: leaderboard per quiz (best/most recent submitted attempt
-- per student, ranked by score then completion time).
-- =========================================================
create or replace view quiz_leaderboard as
select
  quiz_id,
  student_id,
  first_name,
  last_name,
  score,
  total_questions,
  percentage,
  started_at,
  submitted_at,
  row_number() over (
    partition by quiz_id
    order by score desc, submitted_at asc
  ) as rank
from (
  -- one row per student per quiz: their best attempt (highest score,
  -- earliest submission time as tiebreaker)
  select distinct on (a.quiz_id, a.student_id)
    a.quiz_id,
    a.student_id,
    s.first_name,
    s.last_name,
    a.score,
    a.total_questions,
    a.percentage,
    a.started_at,
    a.submitted_at
  from attempts a
  join students s on s.id = a.student_id
  where a.status = 'submitted'
  order by a.quiz_id, a.student_id, a.score desc, a.submitted_at asc
) best_attempts;
