# AGORA QUIZ

A complete, production-shaped online quiz platform: students register, take quizzes
shared via a link, and get scored results; administrators create quizzes, import
questions from CSV, manage subjects, control visibility of results/explanations/
leaderboards, and configure platform-wide settings (WhatsApp channel link,
contact number) — all without touching code.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, a
**Supabase Postgres** database, real password hashing (bcrypt) and signed
session cookies (JWT). No localStorage-faked data, no hard-coded results.

---

## 1. Prerequisites

- Node.js 18.18+ (Node 20 recommended)
- A free [Supabase](https://supabase.com) project
- An EdgeOne account with Pages (or any Node-compatible host) for deployment

## 2. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and run the entire contents of `supabase/schema.sql`.
   This creates every table, the default admin account (username `admin`,
   temporary password `Columela`), the five starter subjects, and the
   leaderboard view.
3. Open **Storage** and create a **public** bucket named `agora-quiz-media`
   (or pick your own name and set `SUPABASE_STORAGE_BUCKET` accordingly).
   This is where question diagrams/images are stored.
4. Open **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only, never
     expose this in client code or commit it**)

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values above, plus:

- `SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`)
- `SUPABASE_STORAGE_BUCKET` — the bucket name from step 2.3
- `NEXT_PUBLIC_SITE_URL` — your deployed domain (used when building quiz links)

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Log in to the admin dashboard at
`/admin/login` with username `admin` and password `Columela` — you'll be
required to set a new password immediately (as specified).

## 5. Using the platform

**Admin:**
1. Log in at `/admin/login`, set your new password.
2. Go to **Settings** and paste your real WhatsApp Channel link and
   contact phone number — these are used automatically everywhere they're
   needed, with no code edits.
3. Go to **Quizzes → + New Quiz**, pick subjects, duration and attempt
   limit.
4. Open the quiz, add questions manually or **Import CSV** (columns:
   `Question, Option A, Option B, Option C, Option D, Correct Answer,
   Explanation` — a header row is optional and auto-detected).
5. Click **Publish Quiz**, then **Copy** the quiz link and share it with
   students. Any registered student who opens that link can take the quiz —
   it is never restricted to the admin account.

**Students:**
1. Open the shared quiz link.
2. Register or log in.
3. Follow the WhatsApp instructions, then tap **Start**.
4. Take the quiz (timer, calculator, question navigator, Next/Previous).
5. Submit — results and a question-by-question review appear if the admin
   has made them public; otherwise a confirmation is shown and the score
   stays hidden until released.

## 6. Deploying to EdgeOne

1. Push this project to a Git repository (GitHub/GitLab).
2. In the EdgeOne console, create a new **Pages** project and connect the
   repository.
3. Framework preset: **Next.js**. Build command: `npm run build`. Output:
   handled automatically by the Next.js preset (SSR via EdgeOne's Node.js
   functions runtime).
4. Add all the environment variables from `.env.example` in the EdgeOne
   project's **Environment Variables** settings (do this for both
   Production and Preview environments). Never put the service role key in
   client-exposed variables — only `NEXT_PUBLIC_*` keys are sent to the
   browser.
5. Deploy. Once live, set `NEXT_PUBLIC_SITE_URL` to your EdgeOne domain and
   redeploy so generated quiz links use the correct domain.
6. In Supabase Storage, double-check the media bucket is public so student
   browsers can load question images directly.

If your EdgeOne plan does not support Node.js SSR functions, you can instead
deploy the API routes as standalone serverless functions and the rest of the
app as a static export — consult EdgeOne's current Next.js deployment guide,
since hosting capabilities change over time.

## 7. Notes on the spec

- The **"Lenard"** font requested for long reading passages is not published
  on Google Fonts. **Literata**, a highly readable serif built for long-form
  reading, is used in its place (`font-lenard` Tailwind class still maps to
  it). Swap in a licensed Lenard font file later if you obtain one.
- WhatsApp channel membership is **not programmatically verifiable** — no
  such public API exists. The Start button appears once the student clicks
  "Join WhatsApp Channel" and returns, as specified; this is not a
  technical verification and the app never claims to be one.
- All scores, attempts, and leaderboard rankings are computed from real
  stored answers — nothing is hard-coded or faked.
