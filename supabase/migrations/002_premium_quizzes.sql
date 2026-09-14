-- Adds premium/paid quiz support.
alter table quizzes add column if not exists is_premium boolean not null default false;
