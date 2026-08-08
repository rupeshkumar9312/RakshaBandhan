# Rakhi Bazaar

A full-stack rakhi store for a Noida society — storefront plus admin panel, built with Next.js 15, Prisma and Tailwind v4. Cash on Delivery only.

---

## Quick start

```bash
npm install --legacy-peer-deps && npm run db:setup && npm run dev
```

Then open **http://localhost:3000**.

Admin panel: **http://localhost:3000/admin** — `admin@rakhibazaar.in` / `admin123` (set in `.env`).

> `--legacy-peer-deps` is needed because npm 10.2.4 misresolves the React 19 peer graph. Newer npm does not need it.

---

## What's in it

### Storefront

| Route | What it does |
|---|---|
| `/` | Cinematic hero, category grid, featured rail, story, reviews |
| `/products` | Catalog with category/price filters, search, sort, pagination |
| `/products/[slug]` | Gallery with hover-zoom + lightbox, reviews, related products |
| `/cart` | Full cart page (a slide-over drawer is available everywhere) |
| `/checkout` | Three-step COD checkout with progress indicator |
| `/order/[token]` | Order confirmation |
| `/track` | Public order lookup by order number + phone |
| `/blog`, `/about`, `/faq`, `/shipping`, `/contact`, `/privacy`, `/terms` | Content pages |

### Admin (`/admin`, auth required)

- **Dashboard** — revenue, today's takings, 7-day chart, order pipeline, low stock, best sellers
- **Orders** — status tabs, search, inline status changes, detail view with printable invoice/packing slip, WhatsApp/call shortcuts, internal notes
- **Products** — full CRUD, drag-free multi-image upload, inline visible/featured toggles, category filter
- **Customers** — lifetime value, repeat-buyer flags, per-customer order history and favourites

---

## Stack and key decisions

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Server Components + Server Actions; no separate API layer needed |
| Database | Prisma + SQLite | Zero-config locally. Change `provider` in `prisma/schema.prisma` to `postgresql` to deploy |
| Styling | Tailwind v4 | Theme lives in `@theme` in `src/app/globals.css` |
| Admin auth | JWT in an httpOnly cookie (`jose`) + bcrypt | No third-party auth dependency for a two-person store |
| Customers | Guest checkout, keyed by phone | Forced signup kills conversion on a COD society store |
| Money | Integer **paise** everywhere | No floating-point drift; formatted only at render (`src/lib/money.ts`) |

### Things worth knowing

- **Prices are never trusted from the client.** The cart sends only product IDs and quantities; `placeOrder` re-reads prices from the database.
- **Stock is decremented inside a transaction** with a re-check, so two people can't buy the last rakhi. Cancelling an order returns the stock.
- **Order snapshots.** Order items store the name, image and price at purchase time, so editing a product later doesn't rewrite history.
- **Confirmation URLs use a random `publicToken`, not the order number.** Order numbers are sequential and guessable; addressing the page by them would leak customers' addresses to anyone incrementing a URL.
- **Products with orders are retired, not deleted** — deleting would orphan order history.

---

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run start          # serve the production build
npm run db:setup       # push schema + generate client + seed
npm run db:reset       # wipe and re-seed
npm run db:studio      # Prisma Studio
npm run placeholders   # regenerate the placeholder artwork
```

---

## Product images

The seeded catalogue uses **locally generated SVG artwork** in `public/placeholders/` — no external image host, nothing to break offline. They look like rakhis, but they are stand-ins.

Replace them with real photography via **Admin → Products → Edit → Images**. Uploads go to Vercel Blob (JPG/PNG/WebP/AVIF/SVG, max 5 MB, 6 at a time). The upload route rejects unauthenticated requests and generates its own filenames rather than trusting the client's.

> Requires a `BLOB_READ_WRITE_TOKEN` — see `.env.example`. Create a Blob store under the Storage tab in the Vercel dashboard and connect it to the project; Vercel injects the token automatically in production. For local dev, copy the token from the dashboard into `.env`.

---

## Known setup issue on this machine

`~/.npm/_cacache` and `~/.cache/prisma` contain **root-owned files** from an old npm bug. This breaks `npm install` and every Prisma CLI command with `EACCES` / `EPERM: utime`.

Both are worked around already, so the commands above just work:

- npm installs use a project-local cache when needed
- Prisma runs through `scripts/prisma.mjs`, which points `HOME` at `.prisma-home/` for the duration of the command

To fix it permanently — this needs your password, so run it yourself:

```bash
sudo chown -R "$(id -u):$(id -g)" ~/.npm ~/.cache
```

After that you can call `prisma` directly and delete `scripts/prisma.mjs` plus the `.prisma-home/` directory.

---

## Deploying

1. Set `provider = "postgresql"` in `prisma/schema.prisma` and point `DATABASE_URL` at a hosted Postgres (Neon, Supabase, Railway).
2. Set a real `AUTH_SECRET` — `openssl rand -base64 32`.
3. Change `ADMIN_PASSWORD` and re-seed, or update the admin row directly.
4. Move image uploads to object storage (see above).
5. Set `NEXT_PUBLIC_SITE_URL` to the real domain so canonical URLs, the sitemap and JSON-LD are correct.

---

## Not built yet

Called out honestly so nothing looks finished when it isn't:

- **Email/SMS notifications** — order confirmations are on-screen only. There's no mail provider wired up.
- **Wishlist** — the schema has no favourites model.
- **Review moderation UI** — reviews go live immediately; `isApproved` exists on the model but there's no admin screen for it.
- **Discount codes** — `Order.discount` exists and is honoured in totals, but nothing sets it.
- **Live chat** — the contact page points at phone and WhatsApp instead.
- **Automated tests** — verification so far has been a full manual pass plus a clean `tsc --noEmit` and production build.
