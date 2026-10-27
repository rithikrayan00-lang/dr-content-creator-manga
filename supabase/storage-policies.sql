-- Secure manga-pages Storage setup for chapter publishing.
-- Run after supabase/schema.sql. Existing assets are private; public readers
-- can obtain signed URLs only for cover art and pages referenced by published chapters.

insert into storage.buckets (id, name, public)
values ('manga-pages', 'manga-pages', false)
on conflict (id) do update set public = false;

drop policy if exists "Manga admins can read manga assets" on storage.objects;
drop policy if exists "Public can read published manga assets" on storage.objects;
drop policy if exists "Admins can upload manga assets" on storage.objects;
drop policy if exists "Admins can update manga assets" on storage.objects;
drop policy if exists "Admins can delete manga assets" on storage.objects;

-- Anonymous users may only request signed reads for media referenced by a
-- public series cover or a published chapter page. Stored image_url/cover_url
-- values must be object paths, not public URLs, for this policy to match.
create policy "Public can read published manga assets"
on storage.objects for select to anon
using (
    bucket_id = 'manga-pages'
    and (
        exists (
            select 1 from public.series s
            where s.cover_url = storage.objects.name
        )
        or exists (
            select 1
            from public.chapter_pages p
            join public.chapters c on c.id = p.chapter_id
            where p.image_url = storage.objects.name
              and c.published = true
        )
    )
);

create policy "Manga admins can read manga assets"
on storage.objects for select to authenticated
using (
    bucket_id = 'manga-pages'
    and (
        (select public.is_manga_admin())
        or exists (
            select 1 from public.series s
            where s.cover_url = storage.objects.name
        )
        or exists (
            select 1
            from public.chapter_pages p
            join public.chapters c on c.id = p.chapter_id
            where p.image_url = storage.objects.name
              and c.published = true
        )
    )
);

create policy "Admins can upload manga assets"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'manga-pages'
    and (select public.is_manga_admin())
);

create policy "Admins can update manga assets"
on storage.objects for update to authenticated
using (
    bucket_id = 'manga-pages'
    and (select public.is_manga_admin())
)
with check (
    bucket_id = 'manga-pages'
    and (select public.is_manga_admin())
);

create policy "Admins can delete manga assets"
on storage.objects for delete to authenticated
using (
    bucket_id = 'manga-pages'
    and (select public.is_manga_admin())
);
