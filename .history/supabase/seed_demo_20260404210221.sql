-- LearnHub Demo Seed Script
-- Run this AFTER supabase/schema.sql in the Supabase SQL Editor.
-- This script seeds:
-- 1) Auth users (email/password) for quick login
-- 2) Public profile/users data
-- 3) RBAC roles + user roles
-- 4) Subscriptions across tiers and statuses
-- 5) Courses, modules, lessons, progress, notes, bookmarks
-- 6) Media library + admin audit logs
--
-- Demo credentials (all users use the same password):
-- Password: LearnHub#2026
-- admin@learnhub.dev
-- mentor@learnhub.dev
-- lina@learnhub.dev
-- omar@learnhub.dev
-- jules@learnhub.dev
-- maya@learnhub.dev

begin;

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 0) Seed deterministic IDs
-- ---------------------------------------------------------------------
-- Users
-- admin   : 00000000-0000-0000-0000-000000000001
-- mentor  : 00000000-0000-0000-0000-000000000002
-- lina    : 00000000-0000-0000-0000-000000000003
-- omar    : 00000000-0000-0000-0000-000000000004
-- jules   : 00000000-0000-0000-0000-000000000005
-- maya    : 00000000-0000-0000-0000-000000000006

-- ---------------------------------------------------------------------
-- 1) Seed auth users (for login)
-- ---------------------------------------------------------------------
with auth_seed as (
  select * from (
    values
      ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@learnhub.dev',  'System Admin'),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'mentor@learnhub.dev', 'Mentor One'),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'lina@learnhub.dev',   'Lina Rivera'),
      ('00000000-0000-0000-0000-000000000004'::uuid, 'omar@learnhub.dev',   'Omar Khan'),
      ('00000000-0000-0000-0000-000000000005'::uuid, 'jules@learnhub.dev',  'Jules Armand'),
      ('00000000-0000-0000-0000-000000000006'::uuid, 'maya@learnhub.dev',   'Maya Chen')
  ) as t(id, email, full_name)
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin,
  is_sso_user,
  is_anonymous
)
select
  s.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  s.email,
  crypt('LearnHub#2026', gen_salt('bf')),
  now(),
  now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('full_name', s.full_name),
  now(),
  now(),
  false,
  false,
  false
from auth_seed s
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

with auth_seed as (
  select * from (
    values
      ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@learnhub.dev'),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'mentor@learnhub.dev'),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'lina@learnhub.dev'),
      ('00000000-0000-0000-0000-000000000004'::uuid, 'omar@learnhub.dev'),
      ('00000000-0000-0000-0000-000000000005'::uuid, 'jules@learnhub.dev'),
      ('00000000-0000-0000-0000-000000000006'::uuid, 'maya@learnhub.dev')
  ) as t(id, email)
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
)
select
  gen_random_uuid(),
  s.id,
  jsonb_build_object('sub', s.id::text, 'email', s.email),
  'email',
  s.email,
  now(),
  now(),
  now()
from auth_seed s
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

-- ---------------------------------------------------------------------
-- 2) Seed public users profile table
-- ---------------------------------------------------------------------
insert into public.users (id, email, full_name, avatar_url, stripe_customer_id, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@learnhub.dev',  'System Admin', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'cus_demo_admin',  now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'mentor@learnhub.dev', 'Mentor One',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 'cus_demo_mentor', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'lina@learnhub.dev',   'Lina Rivera',  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', 'cus_demo_lina',   now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'omar@learnhub.dev',   'Omar Khan',    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'cus_demo_omar',   now(), now()),
  ('00000000-0000-0000-0000-000000000005', 'jules@learnhub.dev',  'Jules Armand', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', 'cus_demo_jules',  now(), now()),
  ('00000000-0000-0000-0000-000000000006', 'maya@learnhub.dev',   'Maya Chen',    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80', 'cus_demo_maya',   now(), now())
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  stripe_customer_id = excluded.stripe_customer_id,
  updated_at = now();

-- ---------------------------------------------------------------------
-- 3) RBAC roles + assignments
-- ---------------------------------------------------------------------
insert into public.roles (name)
values ('admin'), ('instructor'), ('member')
on conflict (name) do nothing;

-- Admin + instructor + members
insert into public.user_roles (user_id, role_id, created_at, created_by)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  r.id,
  now(),
  '00000000-0000-0000-0000-000000000001'::uuid
from public.roles r
where r.name = 'admin'
on conflict (user_id, role_id) do nothing;

insert into public.user_roles (user_id, role_id, created_at, created_by)
select
  '00000000-0000-0000-0000-000000000002'::uuid,
  r.id,
  now(),
  '00000000-0000-0000-0000-000000000001'::uuid
from public.roles r
where r.name = 'instructor'
on conflict (user_id, role_id) do nothing;

insert into public.user_roles (user_id, role_id, created_at, created_by)
select u.id, r.id, now(), '00000000-0000-0000-0000-000000000001'::uuid
from public.users u
cross join public.roles r
where r.name = 'member'
  and u.id in (
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid
  )
on conflict (user_id, role_id) do nothing;

-- ---------------------------------------------------------------------
-- 4) Subscriptions (full flow coverage)
-- ---------------------------------------------------------------------
insert into public.subscriptions (
  id,
  user_id,
  stripe_subscription_id,
  stripe_price_id,
  tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'sub_demo_mentor_core',  'price_demo_core',    'core',    'active',    now() - interval '8 days',  now() + interval '22 days', false, now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'sub_demo_lina_insider', 'price_demo_insider', 'insider', 'trialing',  now() - interval '3 days',  now() + interval '11 days', false, now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'sub_demo_omar_pro',     'price_demo_pro',     'pro',     'active',    now() - interval '14 days', now() + interval '16 days', false, now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'sub_demo_jules_core',   'price_demo_core',    'core',    'past_due',  now() - interval '32 days', now() - interval '2 days',  false, now(), now()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'sub_demo_maya_pro',     'price_demo_pro',     'pro',     'canceled',  now() - interval '45 days', now() - interval '15 days', true,  now(), now())
on conflict (user_id) do update
set
  stripe_subscription_id = excluded.stripe_subscription_id,
  stripe_price_id = excluded.stripe_price_id,
  tier = excluded.tier,
  status = excluded.status,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  cancel_at_period_end = excluded.cancel_at_period_end,
  updated_at = now();

-- ---------------------------------------------------------------------
-- 5) Courses
-- ---------------------------------------------------------------------
insert into public.courses (
  id,
  title,
  slug,
  description,
  thumbnail_url,
  required_tier,
  is_published,
  order_index,
  created_at,
  updated_at
)
values
  ('20000000-0000-0000-0000-000000000001', 'Product Strategy Foundations', 'product-strategy-foundations', 'Build strategic product thinking from first principles.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80', 'insider', true, 1, now(), now()),
  ('20000000-0000-0000-0000-000000000002', 'Systems for Senior ICs',       'systems-for-senior-ics',       'Execution systems for scaling your technical influence.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 'core',    true, 2, now(), now()),
  ('20000000-0000-0000-0000-000000000003', 'Executive Communication Lab',  'executive-communication-lab',  'Narrative, alignment, and stakeholder influence.',       'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', 'pro',     true, 3, now(), now()),
  ('20000000-0000-0000-0000-000000000004', 'AI Product Playbook',          'ai-product-playbook',          'AI-first workflows and product strategy frameworks.',     'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80', 'core',    false,4, now(), now())
on conflict (id) do update
set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  required_tier = excluded.required_tier,
  is_published = excluded.is_published,
  order_index = excluded.order_index,
  updated_at = now();

-- ---------------------------------------------------------------------
-- 6) Modules
-- ---------------------------------------------------------------------
insert into public.modules (id, course_id, title, slug, description, order_index, created_at)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Foundations',        'foundations',        'Core strategic principles', 1, now()),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Decision Systems',   'decision-systems',   'Decision frameworks',       2, now()),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Technical Leverage', 'technical-leverage', 'Scaling impact as IC',      1, now()),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Executive Presence', 'executive-presence', 'Communicate with clarity',  1, now())
on conflict (id) do update
set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  order_index = excluded.order_index;

-- ---------------------------------------------------------------------
-- 7) Lessons
-- ---------------------------------------------------------------------
insert into public.lessons (
  id,
  module_id,
  title,
  slug,
  content,
  video_url,
  duration,
  is_preview,
  order_index,
  created_at
)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Strategic Lens',          'strategic-lens',          'Understand market, user, and business tension.', 'https://example.com/video/strategic-lens.mp4', 760, true,  1, now()),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Problem Framing',         'problem-framing',         'Frame problems with measurable outcomes.',       'https://example.com/video/problem-framing.mp4', 980, false, 2, now()),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Decision Velocity',       'decision-velocity',       'Create fast and reversible decision loops.',     'https://example.com/video/decision-velocity.mp4', 860, false, 1, now()),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'Influence Without Title', 'influence-without-title', 'Ship impact through trust and systems.',         'https://example.com/video/influence-without-title.mp4', 720, true,  1, now()),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Architecture Narrative',  'architecture-narrative',  'Communicate architecture decisions simply.',     'https://example.com/video/architecture-narrative.mp4', 890, false, 2, now()),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 'Room Dynamics',          'room-dynamics',          'Read and steer high-stakes conversations.',      'https://example.com/video/room-dynamics.mp4', 830, false, 1, now())
on conflict (id) do update
set
  title = excluded.title,
  slug = excluded.slug,
  content = excluded.content,
  video_url = excluded.video_url,
  duration = excluded.duration,
  is_preview = excluded.is_preview,
  order_index = excluded.order_index;

-- ---------------------------------------------------------------------
-- 8) Progress
-- ---------------------------------------------------------------------
insert into public.user_progress (
  id,
  user_id,
  lesson_id,
  completed,
  last_position,
  completed_at,
  updated_at
)
values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', true,  760, now() - interval '1 day', now() - interval '1 day'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', false, 410, null, now() - interval '3 hours'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', true,  720, now() - interval '2 days', now() - interval '2 days'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', false, 200, null, now() - interval '5 hours'),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', false, 95,  null, now() - interval '6 hours')
on conflict (user_id, lesson_id) do update
set
  completed = excluded.completed,
  last_position = excluded.last_position,
  completed_at = excluded.completed_at,
  updated_at = excluded.updated_at;

-- ---------------------------------------------------------------------
-- 9) Notes
-- ---------------------------------------------------------------------
insert into public.notes (id, user_id, lesson_id, content, timestamp, created_at, updated_at)
values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Great framework: problem = desired outcome + constraints.', 420, now() - interval '2 hours', now() - interval '2 hours'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', 'Use a three-layer architecture story in design reviews.', 180, now() - interval '5 hours', now() - interval '5 hours')
on conflict (id) do update
set
  content = excluded.content,
  timestamp = excluded.timestamp,
  updated_at = excluded.updated_at;

-- ---------------------------------------------------------------------
-- 10) Bookmarks
-- ---------------------------------------------------------------------
insert into public.bookmarks (id, user_id, lesson_id, created_at)
values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', now() - interval '1 day'),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', now() - interval '8 hours')
on conflict (user_id, lesson_id) do nothing;

-- ---------------------------------------------------------------------
-- 11) Media library
-- ---------------------------------------------------------------------
insert into public.media_library (
  id,
  title,
  type,
  file_path,
  required_tier,
  duration,
  pages,
  cover_url,
  created_at
)
values
  ('80000000-0000-0000-0000-000000000001', 'Strategic Thinking Handbook', 'pdf',   'books/strategic-thinking-handbook.pdf', 'core', null, 184, 'https://images.unsplash.com/photo-1455885666463-9f6f1cb4f8f6?auto=format&fit=crop&w=700&q=80', now()),
  ('80000000-0000-0000-0000-000000000002', 'Leadership Audio Sprint',    'audio', 'audio/leadership-sprint.mp3',         'insider', 2400, null, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=700&q=80', now()),
  ('80000000-0000-0000-0000-000000000003', 'Exec Communication Playbook', 'epub',  'books/exec-communication.epub',       'pro', null, 132, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80', now())
on conflict (id) do update
set
  title = excluded.title,
  type = excluded.type,
  file_path = excluded.file_path,
  required_tier = excluded.required_tier,
  duration = excluded.duration,
  pages = excluded.pages,
  cover_url = excluded.cover_url;

-- ---------------------------------------------------------------------
-- 12) Admin audit logs (sample activity)
-- ---------------------------------------------------------------------
insert into public.admin_audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
values
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'assign_admin_role', 'user', '00000000-0000-0000-0000-000000000002', '{"reason":"promoted mentor"}'::jsonb, now() - interval '10 days'),
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'grant_access',      'user', '00000000-0000-0000-0000-000000000004', '{"tier":"pro","durationDays":30}'::jsonb, now() - interval '6 days'),
  ('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'publish_courses',   'course', '20000000-0000-0000-0000-000000000003', '{"source":"bulk action"}'::jsonb, now() - interval '4 days')
on conflict (id) do update
set
  action = excluded.action,
  metadata = excluded.metadata,
  created_at = excluded.created_at;

commit;

-- ---------------------------------------------------------------------
-- Optional checks you can run after seeding
-- ---------------------------------------------------------------------
-- select id, email from auth.users where email like '%@learnhub.dev';
-- select id, email, full_name from public.users order by created_at desc;
-- select u.email, r.name role from public.user_roles ur join public.users u on u.id = ur.user_id join public.roles r on r.id = ur.role_id;
-- select user_id, tier, status from public.subscriptions order by created_at;
-- select c.title, m.title module, l.title lesson from public.courses c join public.modules m on m.course_id = c.id join public.lessons l on l.module_id = m.id order by c.order_index, m.order_index, l.order_index;
