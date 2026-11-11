# LiamTech Enterprise Limited — Next.js storefront

*Innovating Your Future.* An auto-parts storefront built with Next.js 16 (App Router), Prisma and Neon Postgres. Its layout and theme are based on the amexautoparts.com storefront.

The look comes from the site's own compiled theme. Bootstrap 4 plus the Regulus/Oscar theme are served unchanged from
`public/static/webpack_bundles/`. All markup uses the same class names. The original jQuery widgets were
re-implemented as small React components: slick carousels, select2, the mega menu, the gallery and the collapses.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions), **React 19**
- **Prisma 5** with **Neon Postgres** (pooled `DATABASE_URL` + direct `DIRECT_URL`)
- Cookie sessions with bcrypt passwords and a DB-backed basket (no third-party auth)

## Getting started

Neon services are declared in `neon.ts`: Postgres plus a private Object Storage bucket called `assets`.

```bash
npm install
neon link                     # or: neon checkout <branch>; pulls DATABASE_URL*, AWS_* into .env
neon deploy                   # provisions what neon.ts declares (the "assets" bucket)
npm run db:push               # create the tables
npm run db:seed               # load categories, products, vehicles, stores, banners, pages
npm run media:upload -- <dir> # upload catalogue images into the bucket (keys: media/…)
npm run dev                   # http://localhost:3000
```

### How Neon is wired

- **Postgres** — Prisma uses the pooled `DATABASE_URL` at runtime. Migrations and `db push` use `DATABASE_URL_UNPOOLED`.
  `src/lib/db-url.ts` removes `channel_binding=require`, because Prisma 5's engine hangs on it. It also adds connect and pool
  timeouts that survive scale-to-zero wake-ups. This happens in code because `neon env pull` rewrites `.env`.
- **Object Storage** — catalogue images (product, brand, banner and store photos) live in the `assets` bucket under
  `media/…`. `src/app/media/[...key]/route.ts` streams them with `Cache-Control: immutable`, so `/media/…` URLs
  in the database are unchanged and the CDN caches them. The S3 client (`src/lib/storage.ts`) reads the `AWS_*`
  variables that `neon deploy` pulls. Because storage branches with the database, every Neon branch gets the images too.

`db:seed` is destructive for catalogue/CMS tables (categories, products, banners, pages…). Users, orders and stores
are kept (stores are upserted).

## What's included

| Area | Routes |
| --- | --- |
| Home (CMS-driven sections, banners, brands) | `/` |
| Catalogue browse with facets, sort, pagination, vehicle filter | `/catalogue/`, `/catalogue/category/[...path]/`, `/catalogue/on-sale/`, `/catalogue/manufacturer/[slug]/` |
| Search + typeahead | `/search/?q=`, `/api/suggest/` |
| Product detail, gallery, share, reviews | `/catalogue/[slug]/`, `/catalogue/[slug]/reviews/add/` |
| Basket (anonymous + per-user, merged on login) | `/basket/` |
| Checkout (click & collect or delivery) → order | `/checkout/`, `/checkout/thank-you/` |
| Accounts: login, profile, order history (no self-registration) | `/accounts/login/`, `/accounts/`, `/accounts/orders/[number]/` |
| Stores (map, opening times), contact form | `/stores/`, `/contact/` |
| CMS pages from the DB | `/about/`, `/terms-and-conditions/`, `/privacy-policy/`, `/delivery-pickup/` |
| Vehicle make → model → year lookups | `/api/vehicles/models/`, `/api/vehicles/years/` |

## Admin panel (`/admin/`)

Self-registration is disabled. Admin accounts are created from the command line:

```bash
npm run admin:create -- admin@liamtech.co.ke '<password>'   # creates the account, or resets its password
```

1. Add the email to `ADMIN_EMAILS` in `.env` (comma-separated for several admins) and restart the server.
   In production, set the same variable in your host's environment settings.
2. Sign in at **`/accounts/login/?next=/admin/`**. Visiting `/admin/` while signed out redirects there too.

`npm run db:seed` also creates or updates the admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`.

| Section | What you can do |
| --- | --- |
| Dashboard | Pending/processing orders, 30-day revenue and orders, stock and message counts, recent orders |
| Orders | Search/filter, view, change status (pending → processing → completed / cancelled), call/WhatsApp/email the customer |
| Products | Search/filter, create, edit price / "was" price (sale ribbon), stock, category, brand, vehicles; upload images |
| Categories | Add, rename, re-parent, reorder, delete (blocked while it still has products or sub-categories) |
| Brands | Add, edit, upload logos, choose which appear in the home "Our product brands" strip |
| Banners | Upload images for the top strip, hero, mid carousel, "More products" tiles and sidebar; links, order, hide/show |
| Home sections | Create the home carousels and add, reorder or remove their products (by SKU or slug) |
| Pages | Edit About / Terms / Privacy / Delivery (HTML), or create new pages at `/<slug>/` |
| Stores | Branches: address, phones, email, opening times, map location, photo |
| Messages / Reviews | Read and delete contact-form messages; hide, publish or delete product reviews |
| Customers | Registered accounts and their order counts |

Security: every admin page and every admin server action calls `requireAdmin()` (`src/lib/admin.ts`).
Signed-out visitors are sent to log in, and signed-in non-admins get a 404. Uploads accept only PNG, JPEG,
WebP or GIF images up to 5 MB, checked by their file signature, and are stored in the `assets` bucket under
`media/uploads/`.

## Data model

See `prisma/schema.prisma`. Content that changes is all in the database:

- `HomeSection`/`HomeSectionItem` — home carousels
- `Banner` with `placement` = `top | hero | mid | featured_link | sidebar`
- `Page` — CMS pages
- `Store` — branches

## Notes

- `prisma/seed-data/seed.json` (and the images now in the `assets` bucket) hold a snapshot of the catalogue scraped from the live site.
  It covers the first page of every top-level category, the home page and the on-sale listing.
- Payment is not integrated. Orders are created as `pending` and paid on collection/delivery. Add M-Pesa
  (Daraja STK push) in `src/app/actions/checkout.ts` if needed.
