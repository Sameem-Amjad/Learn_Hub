create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  tier text not null check (tier in ('insider', 'core', 'pro')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  description text,
  thumbnail_url text,
  required_tier text not null check (required_tier in ('insider', 'core', 'pro')),
  is_published boolean default false,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  order_index integer default 0,
  created_at timestamptz default now(),
  unique(course_id, slug)
);

create table if not exists lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  slug text not null,
  content text,
  video_url text,
  duration integer,
  is_preview boolean default false,
  order_index integer default 0,
  created_at timestamptz default now(),
  unique(module_id, slug)
);

create table if not exists user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed boolean default false,
  last_position integer default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  content text not null,
  timestamp integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table if not exists media_library (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text not null check (type in ('pdf', 'epub', 'audio')),
  file_path text not null,
  required_tier text not null check (required_tier in ('insider', 'core', 'pro')),
  duration integer,
  pages integer,
  cover_url text,
  created_at timestamptz default now()
);

alter table users enable row level security;
alter table subscriptions enable row level security;
alter table user_progress enable row level security;
alter table notes enable row level security;
alter table bookmarks enable row level security;

create policy "users select self" on users
for select using (auth.uid() = id);

create policy "progress select self" on user_progress
for select using (auth.uid() = user_id);

create policy "progress modify self" on user_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes select self" on notes
for select using (auth.uid() = user_id);

create policy "notes modify self" on notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
