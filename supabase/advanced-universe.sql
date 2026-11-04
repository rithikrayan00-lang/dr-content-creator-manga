-- Add character profiles and series world-building without changing existing
-- series, chapters, chapter pages, or admin accounts.
-- Run after schema.sql and storage-policies.sql. Re-running this migration is safe.

create table if not exists public.characters (
    id uuid primary key default gen_random_uuid(),
    series_id uuid not null
        references public.series(id) on delete cascade,
    name text not null check (length(btrim(name)) between 1 and 120),
    slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    portrait_url text,
    description text not null default '',
    age text,
    abilities text[] not null default '{}',
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (series_id, slug),
    unique (id, series_id)
);

create table if not exists public.character_relationships (
    series_id uuid not null
        references public.series(id) on delete cascade,
    character_id uuid not null,
    related_character_id uuid not null,
    relationship text not null check (length(btrim(relationship)) between 1 and 120),
    description text not null default '',
    created_at timestamptz not null default now(),
    primary key (character_id, related_character_id, relationship),
    check (character_id <> related_character_id),
    foreign key (character_id, series_id)
        references public.characters(id, series_id) on delete cascade,
    foreign key (related_character_id, series_id)
        references public.characters(id, series_id) on delete cascade
);

create table if not exists public.world_entries (
    id uuid primary key default gen_random_uuid(),
    series_id uuid not null
        references public.series(id) on delete cascade,
    entry_type text not null check (
        entry_type in ('lore', 'location', 'kingdom', 'faction', 'timeline', 'power_system')
    ),
    title text not null check (length(btrim(title)) between 1 and 160),
    slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    summary text not null default '',
    content text not null default '',
    image_url text,
    published boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (series_id, slug),
    unique (id, series_id)
);

create table if not exists public.character_world_entries (
    series_id uuid not null
        references public.series(id) on delete cascade,
    character_id uuid not null,
    world_entry_id uuid not null,
    created_at timestamptz not null default now(),
    primary key (character_id, world_entry_id),
    foreign key (character_id, series_id)
        references public.characters(id, series_id) on delete cascade,
    foreign key (world_entry_id, series_id)
        references public.world_entries(id, series_id) on delete cascade
);

create index if not exists characters_published_series_idx
    on public.characters (series_id, published, name);
create index if not exists character_relationships_related_idx
    on public.character_relationships (related_character_id);
create index if not exists world_entries_published_series_idx
    on public.world_entries (series_id, published, entry_type, sort_order);
create index if not exists character_world_entries_world_idx
    on public.character_world_entries (world_entry_id);

alter table public.characters enable row level security;
alter table public.character_relationships enable row level security;
alter table public.world_entries enable row level security;
alter table public.character_world_entries enable row level security;

drop policy if exists "Public can read published characters" on public.characters;
drop policy if exists "Manga admins manage characters" on public.characters;
drop policy if exists "Public can read published character relationships" on public.character_relationships;
drop policy if exists "Manga admins manage character relationships" on public.character_relationships;
drop policy if exists "Public can read published world entries" on public.world_entries;
drop policy if exists "Manga admins manage world entries" on public.world_entries;
drop policy if exists "Public can read published character world links" on public.character_world_entries;
drop policy if exists "Manga admins manage character world links" on public.character_world_entries;
drop policy if exists "Public can read published universe assets" on storage.objects;

create policy "Public can read published characters"
on public.characters for select to anon, authenticated
using (published or (select public.is_manga_admin()));

create policy "Manga admins manage characters"
on public.characters for all to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

create policy "Public can read published character relationships"
on public.character_relationships for select to anon, authenticated
using (
    (select public.is_manga_admin())
    or (
        exists (
            select 1 from public.characters c
            where c.id = character_relationships.character_id
              and c.series_id = character_relationships.series_id
              and c.published = true
        )
        and exists (
            select 1 from public.characters related
            where related.id = character_relationships.related_character_id
              and related.series_id = character_relationships.series_id
              and related.published = true
        )
    )
);

create policy "Manga admins manage character relationships"
on public.character_relationships for all to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

create policy "Public can read published world entries"
on public.world_entries for select to anon, authenticated
using (published or (select public.is_manga_admin()));

create policy "Manga admins manage world entries"
on public.world_entries for all to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

create policy "Public can read published character world links"
on public.character_world_entries for select to anon, authenticated
using (
    (select public.is_manga_admin())
    or (
        exists (
            select 1 from public.characters c
            where c.id = character_world_entries.character_id
              and c.series_id = character_world_entries.series_id
              and c.published = true
        )
        and exists (
            select 1 from public.world_entries w
            where w.id = character_world_entries.world_entry_id
              and w.series_id = character_world_entries.series_id
              and w.published = true
        )
    )
);

create policy "Manga admins manage character world links"
on public.character_world_entries for all to authenticated
using ((select public.is_manga_admin()))
with check ((select public.is_manga_admin()));

grant select on public.characters to anon, authenticated;
grant select on public.character_relationships to anon, authenticated;
grant select on public.world_entries to anon, authenticated;
grant select on public.character_world_entries to anon, authenticated;

grant insert, update, delete on public.characters to authenticated;
grant insert, update, delete on public.character_relationships to authenticated;
grant insert, update, delete on public.world_entries to authenticated;
grant insert, update, delete on public.character_world_entries to authenticated;

create policy "Public can read published universe assets"
on storage.objects for select to anon, authenticated
using (
    bucket_id = 'manga-pages'
    and (
        exists (
            select 1 from public.characters c
            where c.portrait_url = storage.objects.name
              and c.published = true
        )
        or exists (
            select 1 from public.world_entries w
            where w.image_url = storage.objects.name
              and w.published = true
        )
    )
);

-- The policy above enables signed reads for published character/world media.
