# The apartment

A lightweight shared calendar for a 2-bedroom apartment used by four people (Karen, Cathy, Jeff, Charlie). Anyone signs in by typing their name — no passwords — sees a month view of who's staying when, and can add / edit / delete stays. Every change is recorded in a per-field activity log.

**Live at:** https://charlton-two.vercel.app

## What it does

- **Month view** with prev/next navigation and a filled-circle "today" badge. On viewports ≥ 1024px wide the current + next month render side-by-side; on smaller screens it's a single month. Nav advances by one month regardless — the pair scrolls together.
- **Multi-day event bars** that wrap at week boundaries and stack vertically when they overlap.
- **Multi-name stays** rendered as a horizontal color split (one segment per user, in their assigned color).
- **Tentative vs. confirmed** stays — tentative gets a dashed border and cream fill.
- **Guest flag** with a soft (non-blocking) warning when four names + guests are selected on a 2-BR apartment.
- **History page** — newest-first activity log; edit rows expand to show old → new for each changed field, create/delete rows show the full entry snapshot.
- **Settings page** — anyone can change anyone's bar color; also has a "Switch user" button that clears the local identity.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js **16.3.4** App Router (RSC + Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS **v4** (CSS-first `@theme` config in `app/globals.css`) |
| Fonts | `next/font` — Playfair Display (headings) + Inter (body) |
| ORM | Prisma **6.19.3** (pinned — see "Prisma version pin" below) |
| Database | Vercel Postgres, backed by Neon |
| Runtime | Node 20+ on Vercel Serverless Functions |
| Package manager | pnpm 12 |

## Layout

```
app/
  layout.tsx                    # Root layout — fonts + IdentityProvider (no DB reads)
  page.tsx                      # Landing (name input)
  (app)/
    layout.tsx                  # Auth shell — server-fetches users, wraps in AuthShell
    calendar/page.tsx           # Month view
    history/page.tsx            # Activity log
    settings/page.tsx           # Colors + switch user
components/
  calendar/{MonthGrid,MonthNav,EntryBar,Legend,CalendarClient}.tsx
  entry/EntryModal.tsx
  history/HistoryList.tsx
  landing/LandingForm.tsx
  settings/SettingsClient.tsx
  shell/AuthShell.tsx           # Client gate — redirects to / if no identity
lib/
  db.ts                         # Prisma client singleton
  identity/context.tsx          # IdentityProvider (root) + AuthContext (authed)
  actions/{entries,users,activity}.ts   # Server Actions
  date/layout.ts                # Month grid + segment + lane algorithm
  types.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
```

## Data model

Three tables — see [`prisma/schema.prisma`](prisma/schema.prisma) for the source of truth.

- **User** — four fixed rows with string IDs (`karen`, `cathy`, `jeff`, `charlie`). `color` is a `#RRGGBB` string, editable by anyone.
- **Entry** — `startDate` / `endDate` stored as `@db.Date` (day-only, no time zone bugs). Status enum `Confirmed | Tentative`. `hasGuests` bool. `createdById` / `updatedById` FKs to User.
- **EntryUser** — join table with a composite key `(entryId, userId)` and an `order` int (used for the color-split render order).
- **ActivityLog** — every mutation writes a row: `actor`, `action` (`Create | Update | Delete`), `entryId` (nullable, retained after entry deletion), `summary` string, and `changes` JSON. For `Update` rows, `changes.fields` is an array of `{ field, old, new }`; for `Create` / `Delete`, `changes.snapshot` is the full entry state.

**Transactionality:** every server action wraps the mutation + the `ActivityLog` insert in a single `prisma.$transaction(async (tx) => { ... })`. The log can never drift from state.

## Identity

There's no real auth — this is a trust-based tool for a group of four friends. Identity is just a userId in `localStorage["apartment.currentUserId"]`, and every mutation server action takes an explicit `actorId` argument from the client.

**But the name whitelist is not exposed on the public landing page.** Identity is split into two React contexts:

- **`IdentityProvider`** (mounted in the root layout, available on every route): tracks only the userId string in `localStorage`. Does not know user names or colors. So the landing page HTML contains no reference to any of the four names.
- **`AuthShell` + `AuthContextProvider`** (mounted only inside the `(app)/` route group, after `getUsers()` has been server-fetched): adds `currentUser` and `allUsers` to the tree. The whitelist only reaches the browser once the client has established a valid identity.

Name validation on the landing form goes through a `resolveName(name)` server action that returns `{ valid: true, id }` or `{ valid: false }` — never leaking whether a given name is in the DB beyond that binary.

Someone editing devtools can still impersonate any of the four users, and someone who already knows the names can log in. That's the intended threat model.

## Bar rendering

The core of the visual is in [`lib/date/layout.ts`](lib/date/layout.ts):

1. **Grid** — build a 6×7 grid of dates starting on the Monday of the week containing day 1 of the visible month.
2. **Segment splitting** — for each entry, emit one segment per week it overlaps: `{ weekIndex, startCol, span, isStart, isEnd }`. `isStart` / `isEnd` control rounded corners (segments in the middle of a multi-week stretch get square outer edges).
3. **Lane assignment** — per week, sort segments by `startCol` ascending / `span` descending, then greedy interval graph coloring: each segment gets the lowest lane index whose already-occupied columns don't overlap it.
4. **Render** — each week row is a CSS grid with `grid-template-columns: repeat(7, 1fr)`. Bars use `grid-row: 2 + lane` and `grid-column: {startCol+1} / span {span}`.
5. **Multi-name color split** — the bar is a flex row of N equal children, each with a per-user `backgroundColor`, and only the outermost children get `rounded-l-full` / `rounded-r-full`. Text label sits absolutely centered over the whole bar.
6. **Tentative** — same structure but children go transparent, wrapper gets `border-2 border-dashed` in the first user's color, and text switches to that color (no white).

## Environment variables

Env vars use the **Vercel Neon integration's default names**, so the same `schema.prisma` reads from the same names locally and in production without any mapping:

| Name | Purpose |
| --- | --- |
| `POSTGRES_PRISMA_URL` | Pooled connection URL — used by `PrismaClient` at runtime. |
| `POSTGRES_URL_NON_POOLING` | Direct (non-pooled) URL — used by `prisma migrate deploy`. |

Both are gitignored via `.env*` in `.gitignore`. In production Vercel injects them automatically when the Neon store is linked to the project (Storage → your store → Projects → Connect).

## Local development

### Prerequisites

- Node 20+ (this project was built on Node 24.13.1).
- pnpm — `npm install -g pnpm` if you don't have it.
- A `.env` file in the project root with `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` (copy from the Neon dashboard or from `.env.local` on Vercel).

### OneDrive workaround

This project lives inside `C:\Users\KSosnick\OneDrive - Enterprise\Claude\Charlton\`. OneDrive syncing `node_modules` and `.next` causes intermittent EPERM errors, so both dirs are Windows **junction symlinks** pointing to a non-synced cache under `%LOCALAPPDATA%\charlton-cache\`.

If you're setting this up on a fresh machine (or the junctions got clobbered), recreate them **before** running install:

```powershell
mkdir "$env:LOCALAPPDATA\charlton-cache\node_modules"
mkdir "$env:LOCALAPPDATA\charlton-cache\.next"
cd "$env:USERPROFILE\OneDrive - Enterprise\Claude\Charlton"
New-Item -ItemType Junction -Path node_modules -Target "$env:LOCALAPPDATA\charlton-cache\node_modules"
New-Item -ItemType Junction -Path .next        -Target "$env:LOCALAPPDATA\charlton-cache\.next"
```

### Install + run

```bash
pnpm install
pnpm prisma migrate deploy     # applies any pending migrations
pnpm prisma db seed            # only needed once — seeds the four users
pnpm dev                       # http://localhost:3000
```

**Note on `pnpm dev`:** the script is `next dev --webpack`, not the default Turbopack. Turbopack refuses to follow the out-of-tree `node_modules` junction with `Symlink [project]/node_modules is invalid, it points out of the filesystem root`. Webpack has no such restriction. If you ever move this repo out of OneDrive, drop the junctions and switch back to plain `next dev`.

### Common tasks

```bash
pnpm db:migrate      # prisma migrate dev — create a new migration in dev
pnpm db:seed         # re-seed the four users
pnpm db:studio       # Prisma Studio (browsable DB UI)
pnpm db:reset        # nuke and reseed — destructive, dev only
pnpm exec tsc --noEmit    # type-check everything
```

## Deployment

The repo is wired to Vercel with the standard GitHub integration. Any push to `main` triggers a build.

The `build` script runs `prisma migrate deploy && prisma generate && next build`, so pending migrations are applied on every deploy automatically — no manual step or Vercel build-command override needed.

Env vars are injected automatically by the linked Neon store (Storage tab → the store → Projects → your project).

## Design decisions

Notes worth preserving for future work — see also `docs/DECISIONS.md` if we ever spin off design-log entries.

- **Neon integration env var names, not Prisma's docs defaults.** Prisma's docs recommend `DATABASE_URL` / `DIRECT_URL`, but Vercel's Neon integration injects `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`. Using Vercel's names means the schema is drop-in with no manual env var duplication in the dashboard.
- **Prisma version pin at 6.19.3.** At the time of build (Sep 2026) `prisma@latest` on npm was `8.0.0-rc.13` (an RC), and `@prisma/client@latest` was `7.10.0` — mixing them broke installs. Prisma 7 also removed `url` / `directUrl` from `schema.prisma` and requires a driver adapter on the client. For a small app this is unnecessary ceremony; v6.19.3 is the last stable major that still supports the classic schema-based URL model. Locked in `package.json`, not floating.
- **Join table over Postgres `String[]` for entry↔user.** `EntryUser` gives us referential integrity, clean "entries where X participates" queries, and a stable `order` column for the color-split render order.
- **Actor FK to `User`, not enum.** Colors are editable — enums would force a schema migration for every rename.
- **`@db.Date` for `startDate` / `endDate`, not `timestamp`.** Avoids off-by-one bugs from browser/server timezone mismatches. Client constructs `YYYY-MM-DD` strings; server converts with `new Date(Date.UTC(y, m-1, d))`.
- **String IDs (`karen`, `cathy`, ...) not cuids** for the four seeded users. The roster is fixed and the natural key never changes. Simplifies debugging.
- **Server Actions for everything, no `/api` routes.** Small trusted app, form-heavy, no external clients. Mutations pass an explicit `actorId` from the client context so the ActivityLog gets the right attribution.
- **Identity split into two contexts** (see "Identity" above) — keeps the user whitelist out of the public landing page HTML.

## Known caveats

- **No realtime.** A mutation by user A only becomes visible to user B on their next navigation or hard refresh. Fine for a group of four.
- **Impersonation is trivial.** Anyone editing `localStorage["apartment.currentUserId"]` in devtools can pose as any of the four users. The `actorId` sent from the client to server actions is not verified. This is documented and accepted for the trust model.
- **Neon free tier autosuspend.** The DB sleeps after ~5 min idle; the first request after a sleep takes 1–2s to wake it up. Fine for four users.
- **Dev is webpack, not Turbopack** — see the OneDrive workaround section.

## Repo

Source: https://github.com/karenmi555/Charlton
