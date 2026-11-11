-- =============================================================================
-- SeaScan 0005 - feedback (maintenance plan) and community questions
-- =============================================================================

-- Feedback: anyone can send (signed in or not); staff read; admins delete.
-- No name or email is collected.
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid() references auth.users (id) on delete set null,
  category    text not null default 'general' check (category in ('general', 'bug', 'identification', 'content', 'other')),
  message     text not null check (char_length(btrim(message)) between 3 and 2000),
  page        text check (page is null or char_length(page) <= 200),
  rating      smallint check (rating between 1 and 5),
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback: anyone sends" on public.feedback;
create policy "feedback: anyone sends" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "feedback: staff read" on public.feedback;
create policy "feedback: staff read" on public.feedback
  for select to authenticated using (public.is_staff());

drop policy if exists "feedback: admin delete" on public.feedback;
create policy "feedback: admin delete" on public.feedback
  for delete to authenticated using (public.is_admin());

-- Community questions ("Ask a Researcher" in the Community portal).
create table if not exists public.community_questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic       text not null check (char_length(topic) <= 80),
  question    text not null check (char_length(btrim(question)) between 3 and 2000),
  answer      text check (answer is null or char_length(answer) <= 4000),
  status      text not null default 'Open' check (status in ('Open', 'Answered')),
  created_at  timestamptz not null default now()
);

-- Tables created by earlier, undocumented setups may lack these columns.
alter table public.community_questions add column if not exists answer text;
alter table public.community_questions add column if not exists status text not null default 'Open';

alter table public.community_questions enable row level security;

drop policy if exists "questions: read own or staff" on public.community_questions;
create policy "questions: read own or staff" on public.community_questions
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists "questions: ask own" on public.community_questions;
create policy "questions: ask own" on public.community_questions
  for insert to authenticated
  with check (user_id = auth.uid() and answer is null and status = 'Open');

drop policy if exists "questions: staff answer" on public.community_questions;
create policy "questions: staff answer" on public.community_questions
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "questions: delete own or admin" on public.community_questions;
create policy "questions: delete own or admin" on public.community_questions
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());
