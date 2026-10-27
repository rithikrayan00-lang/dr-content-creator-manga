# Dr Content Creator Manga

A responsive multi-series manga platform built with Next.js and Supabase. This repository contains two independent Next.js apps: the public reader at the repository root and the private publishing portal in `admin-portal/`. Both use the same Supabase project and existing manga records.

## 1. Install tools

Install Node.js LTS from https://nodejs.org and VS Code from https://code.visualstudio.com. Open this folder in VS Code. In the VS Code terminal, run:

```bash
npm install
```

## 2. Run locally

Copy `.env.example` to `.env.local`. You can first run without Supabase to preview the public homepage; the admin page requires valid Supabase credentials.

```bash
npm run dev
```

Open http://localhost:3000.

Run the separate admin portal in another terminal:

```powershell
cd admin-portal
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3001. Configure that app's `.env.local` as described in [admin-portal/README.md](admin-portal/README.md).

## 3. Create the Supabase project

1. Create a project at https://supabase.com.
2. Open Project Settings / API and copy the project URL and publishable/anon key.
3. Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

4. In Supabase SQL Editor, run `supabase/schema.sql`, then run `supabase/storage-policies.sql` to set up the private manga-pages bucket and admin-only write policies. The Storage policy migration preserves public reads only for series covers and chapter pages referenced by published chapters.
5. In Authentication, create your own user. Disable public sign-ups if you do not want anyone registering.
6. Add your user ID to the admin allowlist by running this SQL with your actual auth user UUID:

```sql
insert into public.admin_users (user_id)
values ('YOUR-AUTH-USER-UUID');
```

Never use a guessed UUID. Copy your real user ID from Supabase Authentication > Users.

## 4. Publish manga from the dashboard

1. Open the separate portal at http://localhost:3001/login (or your production admin subdomain) and sign in with Supabase Auth. Its real Auth user UUID must be present in `public.admin_users`.
2. Add or select a series. Add chapter number, title, and slug; save it as a draft (the default).
3. Select images in reading order. PNG, JPG/JPEG, and WebP are accepted up to 15 MB each. Reorder or remove queued thumbnails before uploading.
4. Save the pages, use **Preview chapter** to review the uploaded pages privately, then choose **Publish**. Unpublished chapters and their page records remain restricted by database RLS; signed image URLs are generated only for published content or by an authorized admin.

The dashboard uses unique object paths under `series-slug/chapter-slug/` and stores those paths in `chapter_pages.image_url`. Covers are also stored in the same private bucket, with their object path saved to `series.cover_url`. Existing absolute image URLs continue to render. The bucket must stay private; do not enable public bucket access or unrestricted uploads.

## 5. Test the build

```bash
npm run build
```

Resolve any errors before deploying. Keep `.env.local` out of Git; `.gitignore` already excludes it.

## 6. Deploy the public site to Vercel

1. Push the repository to GitHub and import it as a Vercel project.
2. Set the Vercel project's **Root Directory** to the repository root (`.`). The public Next.js app is the root app; `admin-portal/` is excluded from the Vercel deployment by `.vercelignore` and is not deployed.
3. Use the detected Next.js framework settings and root `package.json` scripts (`npm install` and `npm run build`).
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project's Environment Variables for the environments you use. Use the Supabase project URL and its public anon/publishable key.
5. Deploy and test the public catalogue, manga routes, and chapter reader. Add your public domain in Vercel when ready.

Only public Supabase URL and anon/publishable key belong in frontend environment variables. Never add a Supabase service-role key to this app or expose it in client code.

## 7. Connect your own domain

1. Choose and purchase an available domain from a registrar (for example, a `.com` domain). Domain availability and price vary; this project does not register it for you.
2. In Vercel, open the project Settings > Domains and add your exact domain (for example, `yourbrand.com`).
3. Copy the DNS records Vercel shows. Add those exact records in your registrar's DNS control panel; do not guess the record values.
4. Wait for DNS verification and HTTPS provisioning. Add the `www` version too if you want it, and choose the primary domain in Vercel.
5. Update Supabase Authentication > URL Configuration with the production site URL and any required redirect URLs.

## 8. Before public launch checklist

- Replace demo synopsis and chapter names with your real content.
- Confirm public chapter listings and page records load from Supabase.
- Apply `supabase/storage-policies.sql` and test upload, preview, publish, unpublish, and delete as an allowlisted admin.
- Verify row-level security with a non-admin account.
- Use only artwork, fonts, logos, and music you own or have permission to publish.
- Add privacy policy, terms, copyright/contact page, and an email address for takedown requests.
- Test mobile layout, accessibility, image loading, and broken links.
- Back up your source code and original manga files.

## Current features

- Multi-series catalogue, dynamic manga details, title search, and genre filters
- Eclipse Zero featured first, with clearly labeled local sample data when Supabase is not configured
- Dynamic reader routes, published-chapter filtering, signed private page images, and previous/next navigation
- Admin allowlist check, series/chapter CRUD, draft/publish/unpublish controls, ordered page uploads, private preview, and deletion confirmation
- Separate SQL setup for table RLS and Storage policies

The dashboard depends on the Supabase SQL policies. Apply both SQL files and test with an authorized account before using it for production publishing. Email/password reset, comments, analytics, and payments are not included.
