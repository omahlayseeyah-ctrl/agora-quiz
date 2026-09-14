export type Visibility = "public" | "private";
export type QuizStatus = "draft" | "published" | "unpublished" | "archived";
export type AnswerLetter = "A" | "B" | "C" | "D";

export interface Subject {
  id: string;
  name: string;
}

export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  attempt_limit: number | null;
  results_visibility: Visibility;
  explanations_visibility: Visibility;
  leaderboard_visibility: Visibility;
  status: QuizStatus;
  shuffle_questions: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  subject_id: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: AnswerLetter;
  explanation: string | null;
  image_url: string | null;
  order_index: number;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  email: string;
}

export interface Attempt {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_number: number;
  status: "in_progress" | "submitted" | "expired";
  started_at: string;
  ends_at: string;
  submitted_at: string | null;
  score: number | null;
  total_questions: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  percentage: number | null;
}
