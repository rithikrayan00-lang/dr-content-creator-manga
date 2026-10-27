-- Run this in Supabase Dashboard > SQL Editor.

-- =========================================================
-- DR CONTENT CREATOR MANGA - ECLIPSE ZERO
-- Database setup for Supabase
-- Safe to rerun for this schema
-- =========================================================

create extension if not exists pgcrypto;

-- 1. ADMIN USERS
create table if not exists public.admin_users (
    user_id uuid primary key
        references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

-- 2. MANGA SERIES
create table if not exists public.series (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    synopsis text not null default '',
    cover_url text,
    created_at timestamptz not null default now()
);

-- Optional catalogue metadata. Safe to apply to existing installations.
alter table public.series
    add column if not exists genres text[] not null default '{}',
    add column if not exists author text,
    add column if not exists status text;

-- 3. CHAPTERS
create table if not exists public.chapters (
    id uuid primary key default gen_random_uuid(),
    series_id uuid not null
        references public.series(id) on delete cascade,
    chapter_number integer not null check (chapter_number > 0),
    title text not null,
    slug text not null,
    published boolean not null default false,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    unique (series_id, chapter_number),
    unique (series_id, slug)
);

-- 4. CHAPTER PAGES
create table if not exists public.chapter_pages (
    id uuid primary key default gen_random_uuid(),
    chapter_id uuid not null
        references public.chapters(id) on delete cascade,
    page_number integer not null check (page_number > 0),
    image_url text not null,
    created_at timestamptz not null default now(),
    unique (chapter_id, page_number)
);

-- 5. ENABLE ROW LEVEL SECURITY
alter table public.admin_users enable row level security;
alter table public.series enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_pages enable row level security;

-- 6. HELPER FUNCTION: CHECK ADMIN MEMBERSHIP
-- SECURITY DEFINER avoids recursive RLS checks on admin_users.
create or replace function public.is_manga_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.admin_users a
        where a.user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_manga_admin() from public;
grant execute on function public.is_manga_admin() to authenticated;

-- 7. REMOVE OUR OLD POLICIES BEFORE RECREATING THEM
drop policy if exists "Anyone can read series"
    on public.series;
drop policy if exists "Anyone can read published chapters"
    on public.chapters;
drop policy if exists "Anyone can read pages from published chapters"
    on public.chapter_pages;
drop policy if exists "Admins can read admin list"
    on public.admin_users;
drop policy if exists "Admins manage series"
    on public.series;
drop policy if exists "Admins manage chapters"
    on public.chapters;
drop policy if exists "Admins manage chapter pages"
    on public.chapter_pages;

-- 8. PUBLIC READING POLICIES
-- All series are visible; only published chapters and their
-- pages are visible to public/anonymous readers.
create policy "Anyone can read series"
on public.series
for select
to anon, authenticated
using (true);

create policy "Anyone can read published chapters"
on public.chapters
for select
to anon, authenticated
using (published = true or (select public.is_manga_admin()));

create policy "Anyone can read pages from published chapters"
on public.chapter_pages
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.chapters c
        where c.id = chapter_pages.chapter_id
          and c.published = true
    )
    or (select public.is_manga_admin())
);

-- 9. ADMIN POLICIES
create policy "Admins can read admin list"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Admins manage series"
on public.series
for all
to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

create policy "Admins manage chapters"
on public.chapters
for all
to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

create policy "Admins manage chapter pages"
on public.chapter_pages
for all
to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

-- 10. GRANT TABLE ACCESS
grant select on public.series to anon, authenticated;
grant select on public.chapters to anon, authenticated;
grant select on public.chapter_pages to anon, authenticated;
grant select on public.admin_users to authenticated;

grant insert, update, delete on public.series to authenticated;
grant insert, update, delete on public.chapters to authenticated;
grant insert, update, delete on public.chapter_pages to authenticated;

-- 11. INSERT ECLIPSE ZERO
insert into public.series (title, slug, synopsis)
values (
    'Eclipse Zero',
    'eclipse-zero',
    'An original manga by Dr Content Creator.'
)
on conflict (slug) do nothing;

-- =========================================================
-- NEXT: Create your Supabase Auth account, then register
-- its REAL UUID in admin_users using the separate query below.
-- =========================================================
-- insert into public.admin_users (user_id)
-- values ('YOUR-REAL-AUTH-USER-UUID')
-- on conflict (user_id) do nothing;