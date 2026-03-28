# IPL Prediction Game 2026

Private, friends-only IPL prediction game for the 2026 season. Players sign in with Google, join one private room with a room code, lock picks before each match cutoff, and compete on a live leaderboard. Admins seed fixtures, edit cutoffs, and settle winners manually without scraping unofficial live-result APIs.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS + shadcn/ui + Framer Motion + lucide-react
- Auth.js v5 with Google OAuth
- PostgreSQL + Prisma ORM
- Neon Postgres and Vercel-friendly deployment defaults

## Features

- One private room only, seeded automatically from `PRIVATE_ROOM_CODE`
- Google sign-in with Auth.js and Prisma-backed sessions
- Optional email allowlist enforcement
- Editable predictions until `now >= cutoffTimeUtc`
- Per-match cutoff override plus global default cutoff config
- Live leaderboard ranked by points, accuracy, missed picks, then earliest join time
- My Predictions history page
- Admin screens for fixture seeding, manual editing, settlement, unsetting, config updates, and allowlist management
- Official 2026 IPL league-stage fixture seed data in [`prisma/seed-data/ipl-2026.json`](/Users/mukundaholla/homebase/iplpredictiongame/prisma/seed-data/ipl-2026.json)

## Environment Variables

Copy [`.env.example`](/Users/mukundaholla/homebase/iplpredictiongame/.env.example) to `.env` and fill these in:

- `DATABASE_URL`: pooled or runtime Neon/Postgres connection string
- `DIRECT_URL`: direct Postgres connection string for Prisma migrations
- `AUTH_SECRET`: random secret for Auth.js
- `AUTH_GOOGLE_ID`: Google OAuth client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret
- `AUTH_URL` or `NEXTAUTH_URL`: app base URL
- `PRIVATE_ROOM_CODE`: the only join code used by the app
- `ADMIN_EMAILS`: comma-separated Google emails that should be admins
- `ALLOWLIST_ENABLED`: `true` or `false`
- `DEFAULT_CUTOFF_MINUTES`: global default cutoff in minutes
- `TEST_DATABASE_URL`: optional Postgres URL for integration tests
- `TEST_DIRECT_URL`: optional direct URL for integration tests

## Local Setup

1. Install dependencies.

```bash
pnpm install
```

2. Copy the environment file and fill in your values.

```bash
cp .env.example .env
```

3. Generate Prisma client and apply the initial migration.

```bash
pnpm db:generate
pnpm db:migrate
```

4. Seed the room, config, admins, teams, and 2026 fixtures.

```bash
pnpm seed:ipl
```

5. Start the app.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Google OAuth Setup

Create a Google OAuth web app and add these callback URLs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://YOUR_DOMAIN/api/auth/callback/google`

Also set these authorized JavaScript origins:

- Local: `http://localhost:3000`
- Production: `https://YOUR_DOMAIN`

## Database Notes

- All timestamps are stored in UTC.
- Match times are rendered in IST by default in the UI.
- Lock state is computed on request from `cutoffTimeUtc`; no frequent cron is required.
- The leaderboard is computed live from memberships, matches, and predictions.

## Seeding

The seed script is idempotent for the single-room product model:

- upserts the single private room
- creates or updates app config
- adds admin emails to the allowlist
- marks known admin users as `ADMIN`
- upserts all 10 IPL teams
- upserts all 70 league-stage 2026 fixtures

Run it anytime after changing room code, admins, or fixture seed data:

```bash
pnpm seed:ipl
```

## Admin Workflow

After signing in with an admin email:

- go to `/admin` for config, allowlist, and audit visibility
- go to `/admin/matches` to reseed or edit fixtures
- go to `/admin/results` to set winner, mark `ABANDONED` or `NO_RESULT`, unsettle, and recalculate

Settlement is intentionally manual. This app does not scrape unofficial winner APIs.

## Testing

Unit tests:

```bash
pnpm test:unit
```

Integration tests need a dedicated Postgres database configured via `TEST_DATABASE_URL`:

```bash
pnpm test:integration
```

Full local validation:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The build uses `next build --webpack` for reliability in constrained environments.

## Deployment on Vercel + Neon

1. Create a Neon Postgres database.
2. Add `DATABASE_URL` and `DIRECT_URL` to Vercel project env vars.
3. Add the remaining auth and app env vars from [`.env.example`](/Users/mukundaholla/homebase/iplpredictiongame/.env.example).
4. Deploy to Vercel.
5. Run Prisma migrations against production.

```bash
pnpm db:migrate
pnpm seed:ipl
```

6. Log in with an admin email and verify:
   - the room code matches `PRIVATE_ROOM_CODE`
   - fixtures exist
   - allowlist/config values are correct

## Project Scripts

- `pnpm dev`: start local dev server
- `pnpm build`: production build
- `pnpm start`: run the production server
- `pnpm lint`: ESLint
- `pnpm typecheck`: TypeScript check
- `pnpm test`: all tests
- `pnpm test:unit`: unit tests only
- `pnpm test:integration`: integration tests only
- `pnpm db:generate`: Prisma client generation
- `pnpm db:migrate`: local Prisma migration command
- `pnpm db:studio`: Prisma Studio
- `pnpm seed:ipl`: seed room, config, teams, and fixtures

## Official Fixture Sources

- [IPL Fixtures](https://www.iplt20.com/matches/fixtures)
- [BCCI announces schedule for first phase of Tata IPL 2026](https://www.iplt20.com/news/4249/bcci-announces-schedule-for-first-phase-of-tata-ipl-2026)
- [BCCI announces schedule for second phase of Tata IPL 2026](https://www.iplt20.com/news/4256/bcci-announces-schedule-for-second-phase-of-tata-ipl-2026)
