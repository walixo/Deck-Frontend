# Deck

Launch, share and discover new tech — AI models, AI tools, Claude skills, developer tools, mobile
apps, websites and hardware. Every launch joins a daily leaderboard the community votes, comments
and reviews.

Deck is **two repositories**:

| | |
| --- | --- |
| [`Deck-Frontend`](https://github.com/walixo/Deck-Frontend) | This one. React + Vite + TypeScript SPA with Tailwind CSS, React Router and TanStack Query — and the design system: `design/`, `scripts/`, `docs/`. |
| [`Deck-Backend`](https://github.com/walixo/Deck-Backend) | Express + TypeScript REST API on MongoDB (Mongoose). Deployment is documented there, in its `DEPLOY.md`. |

**Clone them side by side.** Nothing breaks if you don't — this repo builds and
runs on its own — but `npm run tokens` writes one generated file into the
backend, and it can only do that if the backend is a sibling directory. It says
so and carries on when it isn't.

```
your-projects/
  Deck-Frontend/   <- you are here
  Deck-Backend/
```

## Requirements

- Node.js 20+ (developed on 22)
- A running MongoDB instance (local `mongod` is fine) — for the API

## Getting started

Two terminals. API first, since the frontend proxies to it.

**1. API** — in the `Deck-Backend` checkout

```bash
npm install && cp .env.example .env && npm run seed && npm run dev
```

Serves `http://localhost:4200`. `npm run seed` wipes the database and loads 7 demo makers and 30
demo launches spread across the last twelve days, so the daily leaderboard has real history to page
through. It also stocks 8 merch products (one deliberately sold out) and makes `ada@deck.dev` staff,
so the catalogue can be managed straight away.

**2. Client** — here

```bash
npm install && npm run dev
```

Serves `http://localhost:3000`. Vite proxies `/api` to port 4200, so the browser stays on one
origin and never hits CORS in development.

### Signing in to the demo data

Every seeded account uses the password `deck1234`:

| Email | Username |
| --- | --- |
| `ada@deck.dev` | ada |
| `mateo@deck.dev` | mateo |
| `priya@deck.dev` | priya |
| `jonas@deck.dev` | jonas |
| `lin@deck.dev` | lin |
| `sofia@deck.dev` | sofia |
| `noah@deck.dev` | noah |

Registering a new account works the same way — no email confirmation step.

## Environment

The API's `.env`, in the `Deck-Backend` checkout (see its `.env.example`):

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4200` | Change it here and in this repo's `vite.config.ts` proxy target |
| `NODE_ENV` | `development` | `production` hides error details and disables request logging |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/deck` | |
| `JWT_SECRET` | — | Replace before deploying anywhere real |
| `JWT_EXPIRES_IN` | `7d` | |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Comma-separated allowlist for CORS |
| `UPLOAD_DIR` | `uploads` | Where uploads are written when Cloudinary is not configured, relative to the API's root |
| `PAYSTACK_SECRET_KEY` | — | Server-only. Blank runs the shop without card payments |
| `PAYSTACK_CALLBACK_URL` | `http://localhost:3000/orders/callback` | Where Paystack returns the customer |
| `CURRENCY` | `NGN` | Must be enabled on your Paystack account |
| `SHIPPING_FLAT_MINOR` | `250000` | ₦2,500, in minor units of `CURRENCY` |
| `FREE_SHIPPING_THRESHOLD_MINOR` | `5000000` | Free over ₦50,000 |

The frontend needs no environment variables; it always talks to `/api` on its own origin.

## Scripts

Both packages expose the same shape:

| Script | Backend | Frontend |
| --- | --- | --- |
| `npm run dev` | `tsx watch` on `src/server.ts` | Vite dev server |
| `npm run build` | `tsc` to `dist/` | `tsc --noEmit && vite build` |
| `npm start` | Runs `dist/server.js` | — (`npm run preview` serves the build) |
| `npm run seed` | Resets and reloads demo data | — |
| `npm run typecheck` | ✓ | ✓ |
| `npm run lint` | ESLint | ESLint |
| `npm run format` | Prettier | Prettier |

## Architecture

### Data model

| Collection | Purpose |
| --- | --- |
| `users` | Account, profile and bcrypt password hash (`select: false`) |
| `items` | A launch. Owns denormalised `voteCount`, `commentCount`, `reviewCount` and `ratingAvg` |
| `votes` | One document per (item, user), with a unique compound index enforcing one vote each |
| `comments` | Comments and reviews. A `rating` of 1–5 makes a comment a review; `parent` makes it a reply |
| `merchproducts` | A shop product. Integer `priceMinor`, plus per-size/colour `variants` carrying their own `sku` and `stock` |
| `orders` | A placed order. Lines snapshot the name and price at purchase, so later catalogue edits never rewrite history |

Two deliberate choices worth knowing about:

- **`launchDateKey`** — every item stores its launch day as a `YYYY-MM-DD` UTC string alongside the
  timestamp. Daily leaderboards are then a plain indexed lookup rather than a date-range
  aggregation, and days can never straddle a boundary differently for different viewers.
- **Denormalised counters** — vote and rating totals live on the item so listings need one query.
  Comment counters are recomputed from the `comments` collection on every write, so they cannot
  drift; vote counts are adjusted transactionally alongside the vote document.

### Ranking

- **Daily leaderboard** — items with today's `launchDateKey`, ordered by votes, then comments, then
  earliest launch.
- **Trending** — recency-weighted: `(votes + 2 × comments + 1) / (ageHours + 4) ^ 1.2`, computed in
  an aggregation so a fresh launch can outrank an older favourite.
- **Top / discussed / newest** — straightforward indexed sorts.

### Frontend

- **Server state** lives entirely in TanStack Query; there is no client-side store mirroring it.
- **URL as state** — Discover reads every filter, sort and page from the query string, so any view
  is linkable and the back button behaves.
- **Optimistic voting** — the same item appears in many caches at once (listings, spotlight,
  leaderboard, profile, related). `useToggleVote` walks the active caches and patches every copy, so
  the count moves instantly and consistently, then reconciles with the server's response.
- **Images are optional everywhere** — a launch can carry a logo, a cover and up to six gallery
  shots, uploaded from the submit form or added later from the product page by its owner
  (`components/ui/ImageUpload.tsx`, `components/items/ManageImages.tsx`). Anything without artwork
  falls back to a deterministic flat-colour monogram keyed to its slug or username (`colourFor` in
  `lib/utils.ts`), so nothing looks broken offline.

### The launch wall

The full-bleed band under the hero (`components/home/LaunchWall.tsx`) is two rows of launch
previews drifting in opposite directions, clipped at both edges so it reads as a slice of something
larger. Worth knowing if you touch it:

- **Seamless loop** — each row holds two identical copies of its cards. Every copy carries a
  trailing gutter equal to the internal gap, so translating exactly `-50%` lands copy two where copy
  one began. Without that trailing gutter the loop lands mid-gap and visibly jumps.
- **The duplicate copy is scenery** — it is `aria-hidden` and `inert`, so all 48 rendered cards are
  announced and tab-reachable exactly 24 times.
- **Pauses on hover *and* focus-within**, so a keyboard user's target stops moving when they reach
  it. Under `prefers-reduced-motion` the rows simply render static.
- **Cards prefer real artwork** — a launch with a `coverUrl` shows the image; everything else gets a
  flat colour panel carrying its own tagline in display type, keyed to its slug. Seeded data has no
  cover art, which is what the fallback is designed for.

## The shop

Deck sells its own merch. The catalogue, cart and checkout run on the same stack — no separate
storefront, no extra services.

### Money

Every price is an **integer in minor units** (kobo for NGN, cents for USD) from the database to the
API to the browser. Floats cannot represent 0.1 exactly, so a cart of three 19,999 tees would drift.
`formatMoney` in `lib/utils.ts` is the single boundary where a price becomes a decimal, and its
output never feeds back into arithmetic. This is also exactly the unit Paystack expects, so nothing
is converted on the way out.

### What the client is trusted with

Nothing that touches money. The checkout payload carries **SKUs and quantities only** — no prices.
The server looks up every line, prices it, checks stock, computes shipping and totals, and charges
that. A tampered cart can change *what* is ordered but never what it costs.

Other guards worth knowing about:

- **Stock is reserved with a conditional update per line** (`updateOne` filtered on
  `stock: { $gte: quantity }`), so two people buying the last tee at once cannot both win. If any
  line loses the race, the lines already taken are handed back.
- **Duplicate SKUs are merged and then re-checked** against the per-line cap. Zod enforces the limit
  per line, which on its own is bypassable by sending the same SKU twice.
- **Failed checkouts unwind completely** — released stock *and* the order row. Leaving the row would
  put an unpayable `awaiting_payment` order in the customer's history with no way to return to it.
- **Catalogue writes are admin-only**; the seed makes `ada@deck.dev` staff.
- Retiring a product **soft-deletes** it (`active: false`) so existing orders keep their references.

### Payments — Paystack

| Variable | Purpose |
| --- | --- |
| `PAYSTACK_SECRET_KEY` | Server-only. Never sent to the browser. |
| `PAYSTACK_CALLBACK_URL` | Where Paystack returns the customer after checkout. |
| `CURRENCY` | Must be a currency your Paystack account is enabled for (NGN, GHS, ZAR, KES, USD). |
| `SHIPPING_FLAT_MINOR` / `FREE_SHIPPING_THRESHOLD_MINOR` | Shipping rule, in minor units of `CURRENCY`. |

The flow: placing an order reserves stock, creates the order `awaiting_payment`, and opens a
Paystack transaction using the order reference as the transaction reference. The browser is handed
only an `authorization_url` to redirect to.

**An order is never marked paid because the browser came back.** The customer controls that
redirect. Payment is confirmed only by asking Paystack directly (`POST /api/orders/:reference/verify`)
or by a webhook, and both paths re-verify against the provider and check that the amount and
currency match the order before settling it.

The webhook (`POST /api/payments/paystack/webhook`) validates an HMAC SHA-512 of the **raw** request
body. It is mounted ahead of `express.json()` in `app.ts` — once that has parsed and discarded the
buffer the signature can never be recomputed, so moving that line breaks webhook verification.
Handling is idempotent: the callback and the webhook routinely both arrive for the same transaction.

With no `PAYSTACK_SECRET_KEY` set the shop still works end to end — orders are created
`awaiting_payment` with no redirect — so the demo runs without keys.

## API

All responses are wrapped: `{ "success": true, "data": … }`, with pagination or leaderboard context
in an optional `meta`. Errors return `{ "success": false, "error": { "message", "details? } }`,
where `details` is a list of `{ field, message }` for validation failures.

Authenticated routes expect `Authorization: Bearer <token>`.

### Auth

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Create an account, returns a token |
| POST | `/api/auth/login` | — | Sign in, returns a token |
| GET | `/api/auth/me` | ✓ | Current user |
| PATCH | `/api/auth/me` | ✓ | Update name, bio, headline, avatar, website |

### Items

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/items` | optional | List with `category`, `pricing`, `tag`, `search`, `sort`, `page`, `limit` |
| GET | `/api/items/spotlight` | optional | Featured launches for the slider |
| GET | `/api/items/:slug` | optional | One launch, plus three related items |
| POST | `/api/items` | ✓ | Create a launch (slug generated, deduplicated) |
| PATCH | `/api/items/:id` | ✓ owner | Update |
| DELETE | `/api/items/:id` | ✓ owner | Delete, along with its votes and comments |
| POST | `/api/items/:id/vote` | ✓ | Toggle your upvote |

Passing a token to the optional routes is what populates `hasVoted` on each item.

### Image uploads

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/uploads` | ✓ | Multipart `images` field, up to 6 files. Returns `[{ url }]` |
| GET | `/uploads/<file>` | — | Serves a stored image |

Set the images on an item by passing the returned paths as `logoUrl`, `coverUrl` and `gallery`
when creating or updating it.

**How uploads are validated.** Files arrive in memory so every one can be checked before it
reaches disk, and each is matched against a magic-byte signature — the filename and the
client-declared mimetype are never trusted on their own. A `.png` that is really HTML is rejected,
which matters because these files are then served back from our own origin. SVG is not accepted: it
can carry script and has no binary signature to verify. Filenames are generated server-side as
UUIDs, so path traversal and collisions are both ruled out. Limits are 5MB per file and 6 files per
request; if any file in a batch fails, the ones already written are removed rather than left
orphaned.

Stored images are served with `X-Content-Type-Options: nosniff` and a restrictive
`Content-Security-Policy`, so a browser cannot second-guess the type we set. The item validator
accepts either an absolute URL or a strict `/uploads/<uuid>.<ext>` path — a looser "starts with /"
check would let a client store an arbitrary path.

In development Vite proxies `/uploads` to the API alongside `/api`, so images resolve as
same-origin paths in the browser.

### Comments and reviews

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/items/:slug/comments` | — | Comments and reviews, newest first |
| POST | `/api/items/:slug/comments` | ✓ | Post a comment; add `rating` (1–5) to make it a review, or `parent` to reply |
| DELETE | `/api/comments/:commentId` | ✓ author | Delete a comment and its replies |

Replies never carry a rating — a rating applies to the product, not to another comment.

### Leaderboard, users and metadata

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/leaderboard?date=YYYY-MM-DD` | Ranked launches for one UTC day, with prev/next day in `meta` |
| GET | `/api/leaderboard/period?period=week\|month\|year\|all` | Top launches over a rolling window |
| GET | `/api/leaderboard/dates` | Last 14 days that have launches, for the date switcher |
| GET | `/api/users/top` | Makers ranked by votes received |
| GET | `/api/users/:username` | Profile, their launches, and their stats |
| GET | `/api/categories` | Categories with live counts |
| GET | `/api/tags` | Most-used tags |
| GET | `/api/stats` | Totals for the landing page |

### Shop

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/merch` | — | Catalogue with `category`, `sort`, `search`, `page`, `limit` |
| GET | `/api/merch/categories` | — | Categories with live counts |
| GET | `/api/merch/:slug` | — | One product, plus three related |
| POST | `/api/merch` | ✓ admin | Create a product |
| PATCH | `/api/merch/:id` | ✓ admin | Update |
| DELETE | `/api/merch/:id` | ✓ admin | Retire (soft delete) |
| GET | `/api/orders/shipping-quote` | — | Shipping for a subtotal, so the cart never guesses |
| POST | `/api/orders` | ✓ | Place an order — SKUs and quantities only, server prices it |
| GET | `/api/orders` | ✓ | Your orders |
| GET | `/api/orders/:reference` | ✓ owner | One order |
| POST | `/api/orders/:reference/verify` | ✓ owner | Confirm payment with Paystack |
| POST | `/api/payments/paystack/webhook` | signature | Paystack webhook (raw body) |
| GET | `/api/health` | Liveness check |

## Design system

**Neo-Brutalist Pop.** Flat colour, thick ink borders, hard offset shadows. Nothing blurs, nothing
glows, nothing fades — depth comes from a second solid edge, never from atmosphere.

- **Palette** — exactly two accents, plus black, white and grey. Cobalt `#2B4BFF` is the primary
  action and anything interactive; acid `#C6FF3D` is the highlight, the active state and the
  loudest thing on any screen. Ink `#111111`, bone `#FAF9F5` and grey `#9C9C99` carry everything
  else. Both accents are fixed — identical in either theme; only the surfaces invert.
- **No third hue** — destructive actions, errors and invalid fields are expressed by **inversion**
  (`bg-edge` with `text-canvas`) rather than a warning colour. Because `--edge` and `--canvas` swap
  between themes, that renders black-on-white in light mode and white-on-black in dark:
  unmistakable against everything around it, and it costs no extra colour. Applies to the danger
  button, `ErrorState`, error `InlineAlert`, field error messages, over-limit counters and the
  remove-image control.
- **Where the accents go** — acid is reserved for highlight and active state (the hero highlight,
  selected filters, first place, an active vote), cobalt for primary actions, links, focus and
  filled rating stars. Grey fills secondary blocks, skeleton loaders and image letterboxing.
  Large repeating surfaces like the launch wall **cycle** through cobalt → ink → acid → grey by
  position rather than hashing off the slug: hashing clumps, and three acid panels in a row swamp
  the page.
- **Themed surfaces** — `--canvas`, `--surface`, `--surface-2`, `--edge`, `--body-ink` and
  `--muted-ink` are plain CSS variables redefined under `.dark`, then exposed to Tailwind as
  `--color-*`. A component writes `border-edge` **once** and it flips automatically — there is no
  `dark:` twin on every border, background and text colour. Hard shadows reference `var(--edge)`
  too, so they invert with everything else.
- **Type** — `Archivo Black` for all display (every `h1`–`h4`, applied in the base layer, set
  uppercase and tight via `.display-tight`), `Geist` for body copy, `Geist Mono` for labels, chips,
  counts and metadata. Mono-uppercase labelling is what makes the UI read as machine output rather
  than marketing copy.
- **Shadows** — `shadow-hard-sm/hard/lg/xl` are pure offsets with no blur and no alpha. Hover moves
  a block *toward* its shadow origin and lengthens the shadow; active slams it flat
  (`translate(3px,3px)` + `shadow-none`), so a press feels physical.
- **Motion** — fast and mechanical: 120ms on interaction, `--ease-snap` for movement and
  `--ease-kick` for anything that should overshoot. `slam` and `slide-up` handle entrances, `stamp`
  fires on upvote, and `jitter` uses `steps(1)` so it snaps between positions instead of easing.
- **Textures** — `bg-gridlines`, `bg-halftone` and `bg-stripes` at low opacity, composed through
  `<Backdrop>` (pattern + optional rotated colour blocks) and `<PageBanner>` (halftone + a cobalt
  rule) from `components/ui/Ambient.tsx`. Both are `aria-hidden` and non-interactive.
- **Illustrations** — chunky flat vector in `components/illustrations/`: thick ink outlines, two or
  three solid brand fills, zero gradients. Outlines use `var(--edge)` so they invert with the
  theme. Each scene carries one small looping animation — the empty deck kicks, the magnifier
  jitters, the comment cursor blinks — and all of it stops under `prefers-reduced-motion`.
  `CategoryIcon.tsx` holds one line icon per category at 2.25px stroke.

Dark mode is class-based (`.dark` on `<html>`), set before first paint by an inline script in
`index.html` so there is no light flash. It follows the OS until the visitor picks a side, then
their choice sticks in `localStorage`. Every component is written for both themes.

## Accessibility

Skip link, labelled landmarks, and a single consistent keyboard-only focus ring. The spotlight
carousel is a labelled region with arrow-key navigation and tab-style dots, and it pauses on hover,
focus and tab-blur. The star rating input uses radio semantics; toggles use `aria-pressed` or
`switch`. Decorative gradients and glyphs are all `aria-hidden`.

## Notes

- `npm audit` is clean in `Deck-Backend`. Here it reports one advisory against React Router's
  RSC mode, which this SPA does not use — the suggested downgrade would reintroduce an open-redirect
  in `<Link>`/`useNavigate` that *does* apply here, so staying on the current version is the safer
  choice.
- All seeded product names are fictional. The vote counts, ratings and comments are generated, so
  nothing in the demo data should be read as information about a real product.
