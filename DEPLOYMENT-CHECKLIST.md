# Launch checklist

- [ ] Install Node.js LTS
- [ ] `npm install`
- [ ] Copy `.env.example` to `.env.local` and configure Supabase
- [ ] Run `supabase/schema.sql`
- [ ] Create one administrator user and add its UUID to `admin_users`
- [ ] Configure `manga-pages` storage upload policies
- [ ] Replace development samples with authorized series, synopsis, and artwork
- [ ] Test the public catalogue, manga details, published chapter pages, and reader navigation
- [ ] `npm run build`
- [ ] Push the source to GitHub; keep `.env.local` and other real environment files untracked
- [ ] Import the repository in Vercel with the repository root (`.`) as the Root Directory
- [ ] Confirm Vercel deploys only the root public app; `admin-portal/` is excluded
- [ ] Set the public Supabase URL and anon/publishable key in Vercel Environment Variables
- [ ] Deploy the public website through Vercel
- [ ] Register domain and configure the DNS records Vercel specifies
- [ ] Test public access, mobile reader, and image/page loading
- [ ] Add privacy, terms, and copyright contact pages
