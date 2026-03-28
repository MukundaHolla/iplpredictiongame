# IPL Prediction Game 2026

Private, friends-only IPL prediction game for the 2026 season. Players sign in with Google, join one or more private rooms with room codes, lock picks before each match cutoff, and compete on room-specific leaderboards. Admins seed fixtures, create rooms, manage room invite lists, edit cutoffs, and settle winners manually without scraping unofficial live-result APIs.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS + shadcn/ui + Framer Motion + lucide-react
- Auth.js v5 with Google OAuth
- PostgreSQL + Prisma ORM
- Local Docker Postgres for development, Neon Postgres for production

## Features

- Multiple private rooms with room-specific codes, invite lists, and leaderboards
- Google sign-in with Auth.js and Prisma-backed sessions
- Remembered last-used room plus room switcher
- Optional room-level email allowlist enforcement
- Editable predictions until `now >= cutoffTimeUtc`
- Per-match cutoff override plus global default cutoff config
- Live leaderboard per room ranked by points, accuracy, missed picks, then earliest join time
- My Predictions history page
- Admin screens for room creation, room settings, allowlist management, fixture seeding, manual editing, settlement, and unsetting
- Official 2026 IPL league-stage fixture seed data in [`prisma/seed-data/ipl-2026.json`](/Users/mukundaholla/homebase/iplpredictiongame/prisma/seed-data/ipl-2026.json)

## Environment Variables

Copy [`.env.example`](/Users/mukundaholla/homebase/iplpredictiongame/.env.example) to `.env` and fill these in:

- `DATABASE_URL`: local Postgres connection string for development
- `DIRECT_URL`: local Postgres connection string for Prisma migrations
- `AUTH_SECRET`: random secret for Auth.js
- `AUTH_GOOGLE_ID`: Google OAuth client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret
- `AUTH_URL` or `NEXTAUTH_URL`: app base URL
- `PRIVATE_ROOM_CODE`: bootstrap room code used only when the first default room is created
- `ADMIN_EMAILS`: comma-separated Google emails that should be admins
- `ALLOWLIST_ENABLED`: bootstrap allowlist mode for the first default room only
- `DEFAULT_CUTOFF_MINUTES`: global default cutoff in minutes
- `TEST_DATABASE_URL`: local Postgres test database connection string
- `TEST_DIRECT_URL`: local Postgres test database connection string

For day-to-day local work, keep `.env` pointed at localhost Postgres only. Do not reuse your live Neon production connection strings in local `.env`.

## Local Setup

1. Install dependencies.

```bash
pnpm install
```

2. Copy the environment file and fill in your values.

```bash
cp .env.example .env
```

3. Start the local Postgres container.

```bash
pnpm db:local:up
```

This starts PostgreSQL 16 on `localhost:5432` with:

- `iplpredictiongame_dev`
- `iplpredictiongame_test`

4. Generate Prisma client and apply migrations to the local dev database.

```bash
pnpm db:generate
pnpm db:migrate:local
```

5. Seed the local dev database.

```bash
pnpm db:seed:local
```

6. Start the app.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

7. Run integration tests against the local test database when needed.

```bash
pnpm test:integration:local
```

This command prepares the local test schema automatically before running the integration suite.

Useful local database commands:

```bash
pnpm db:local:up
pnpm db:local:down
pnpm db:local:reset
pnpm db:migrate:local
pnpm db:test:prepare:local
pnpm db:seed:local
```

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
- Local development and production should use different Postgres databases at all times.

## Seeding

The seed script is idempotent for the multi-room product model:

- creates the default bootstrap room if the database has no rooms yet
- creates or updates app config
- adds admin emails to the bootstrap room allowlist
- marks known admin users as `ADMIN`
- upserts all 10 IPL teams
- upserts all 70 league-stage 2026 fixtures

Run it anytime after changing bootstrap room settings, admins, or fixture seed data:

```bash
pnpm seed:ipl
```

## Admin Workflow

After signing in with an admin email:

- go to `/admin` for global config, room management, and audit visibility
- open any room from `/admin` to manage that room's settings and invite list
- go to `/admin/rooms/[roomSlug]/matches` to reseed or edit fixtures
- go to `/admin/rooms/[roomSlug]/results` to set winner, mark `ABANDONED` or `NO_RESULT`, or unsettle

Settlement is intentionally manual. This app does not scrape unofficial winner APIs.

## Testing

Unit tests:

```bash
pnpm test:unit
```

Integration tests need a dedicated Postgres database configured via `TEST_DATABASE_URL`:

```bash
pnpm test:integration:local
```

Full local validation:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The build uses `next build --webpack` for reliability in constrained environments.

## Deployment on Vercel + Neon

Neon is only needed for deployed environments. Local development should use the Docker Postgres workflow above.

### First Production Launch

1. Import the GitHub repo into Vercel and choose a stable project slug.
2. Use the resulting `https://<project-slug>.vercel.app` URL as the initial production URL.
3. In Google Cloud, add:
   - Authorized JavaScript origin: `https://<project-slug>.vercel.app`
   - Authorized redirect URI: `https://<project-slug>.vercel.app/api/auth/callback/google`
4. In Vercel, set **Production** env vars only:
   - `DATABASE_URL`: Neon pooled/runtime URL
   - `DIRECT_URL`: Neon direct URL
   - `AUTH_SECRET`: fresh production secret
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `AUTH_URL`: `https://<project-slug>.vercel.app`
   - `PRIVATE_ROOM_CODE`: fresh bootstrap room code
   - `ADMIN_EMAILS`
   - `ALLOWLIST_ENABLED=true` if the first bootstrap room should be invite-only
   - `DEFAULT_CUTOFF_MINUTES=60`
5. Do not configure Preview envs for v1. Preview deployments are intentionally unsupported until a separate preview-safe setup exists.

### Reusing The Current Neon Database

If you are reusing the current Neon database for production, back it up first, then clean launch-only data:

```bash
CONFIRM_LAUNCH_CLEAN=YES_DELETE_LAUNCH_DATA pnpm db:launch-clean
```

This removes `User`, `Account`, `Session`, `RoomMembership`, `Prediction`, `AuditLog`, and `VerificationToken` data while keeping seeded teams, fixtures, rooms, app config, and allowlist entries intact.

### Production Migrations And Seed

Run these against the production environment values:

```bash
pnpm db:deploy
pnpm seed:ipl
```

Use `pnpm db:deploy` in production. Do not use `pnpm db:migrate`, because that runs `prisma migrate dev`.

### Production Smoke Test

After the first production deploy:

1. Visit the production `vercel.app` URL.
2. Sign in with an admin email.
3. Join with the production room code.
4. Verify:
   - landing page and login work
   - room join works
   - fixtures exist
   - allowlist/config values are correct
   - dashboard, matches, leaderboard, history, and admin pages load

## Project Scripts

- `pnpm dev`: start local dev server
- `pnpm build`: production build
- `pnpm start`: run the production server
- `pnpm lint`: ESLint
- `pnpm typecheck`: TypeScript check
- `pnpm test`: all tests
- `pnpm test:unit`: unit tests only
- `pnpm test:integration`: integration tests only
- `pnpm test:integration:local`: prepare the local test database and run integration tests
- `pnpm db:generate`: Prisma client generation
- `pnpm db:deploy`: production Prisma migration deploy
- `pnpm db:migrate`: local Prisma migration command
- `pnpm db:local:up`: start the local Docker Postgres container
- `pnpm db:local:down`: stop the local Docker Postgres container
- `pnpm db:local:reset`: rebuild the local Docker Postgres container and databases
- `pnpm db:migrate:local`: apply Prisma migrations to the local dev database
- `pnpm db:test:prepare:local`: apply Prisma migrations to the local test database
- `pnpm db:seed:local`: seed the local dev database
- `pnpm db:launch-clean`: remove launch-only users, sessions, memberships, predictions, and audit logs
- `pnpm db:studio`: Prisma Studio
- `pnpm seed:ipl`: seed bootstrap room, config, teams, and fixtures

## Official Fixture Sources

- [IPL Fixtures](https://www.iplt20.com/matches/fixtures)
- [BCCI announces schedule for first phase of Tata IPL 2026](https://www.iplt20.com/news/4249/bcci-announces-schedule-for-first-phase-of-tata-ipl-2026)
- [BCCI announces schedule for second phase of Tata IPL 2026](https://www.iplt20.com/news/4256/bcci-announces-schedule-for-second-phase-of-tata-ipl-2026)
