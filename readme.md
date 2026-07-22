# Kararehe Math

Kararehe Math is an open-source educational game designed to help tamariki build confident number sense through play.

## Why this project exists

This project was vibe-coded with the help of my six-year-old daughter.

While working through her Year 2 maths homework together, I noticed that many of the challenges weren't simply about getting the right answer—they were about developing the underlying mental models of early numeracy. Concepts like making 10, understanding teen numbers, and bridging through 10 often require intuition before they become automatic.

Rather than building another arithmetic drill app, I wanted to explore whether we could build a game that teaches these foundational ideas one concept at a time.

## An important disclaimer

I am **not** a teacher, mathematics educator, or educational researcher.

I'm a software engineer and a dad who enjoys building things, learning alongside my daughter, and experimenting with how software can support learning.

Because of that, I expect many of my assumptions to be incomplete or even wrong.

## Contributions are encouraged

If you're a teacher, mathematics educator, researcher, parent, or someone passionate about early numeracy, I'd genuinely love your feedback.

In particular I'm interested in discussion around:

- effective ways of teaching early number sense;
- whether particular learning progressions make sense;
- misconceptions children commonly develop;
- visual models that improve understanding;
- how mastery should be assessed; and
- where the game could better align with classroom practice.

Please open an issue, start a discussion, or submit a pull request. Constructive criticism is not only welcome—it's one of the main reasons this project is open source.

The goal isn't to build *my* version of the best maths game.

The goal is to build a maths game that genuinely helps children develop confidence with numbers, informed by the people who understand how children learn best.

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Accounts are optional. Without Neon environment variables the full game continues to work anonymously, with progress stored only in the browser.

## Learner accounts and cloud progress

The account implementation uses Neon Auth for email/password accounts and the Neon Data API for app-owned learner data. Normal browser access is protected by Postgres row-level security using `auth.user_id()`; the browser never receives a database password or Neon API key.

To enable it:

1. Create or select a Neon project and enable Neon Auth with email/password, verification emails, allowed origins, and password-reset emails.
2. Enable the Data API with Neon Auth authentication and grant the authenticated role access to the public schema.
3. Set the direct `DATABASE_URL` and apply the checked-in Prisma migrations with `npm run db:migrate:deploy`.
4. Copy the public Auth and Data API URLs into `.env.local` for development and into Netlify’s build environment for production.

The app remains local-first when signed in: completed attempts are cached with client-generated UUIDs, then idempotently synced. An active question remains device-local. Existing anonymous progress is imported only after email verification and an explicit import choice; the separate guest copy is cleared after either a confirmed import or “Start fresh”.

Birth month and year are optional and private. A full date of birth is never requested. Learners can export their data as JSON from the profile dialog.

## Database migrations

[Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate) owns the database migration history. The Prisma data model is in [`prisma/schema.prisma`](prisma/schema.prisma), and the reviewed SQL history is in [`prisma/migrations`](prisma/migrations). Custom Postgres features that Prisma cannot express—check constraints, row-level security policies, Neon Auth functions, and grants—remain in the SQL migrations.

Use a direct, unpooled Neon connection string for `DATABASE_URL`. For development migrations, also provide `SHADOW_DATABASE_URL` for a separate disposable Neon branch. Neon Auth and the Data API must be enabled on the target before applying the initial migration because its policies use the `authenticated` role and `auth.user_id()`.

For a new database, apply every pending migration:

```sh
npm run db:migrate:deploy
```

For an existing database where the former `0001_learner_accounts.sql` was already applied manually, baseline it once instead of running the initial migration again:

```sh
npm exec prisma -- migrate resolve --applied 20260722000000_init_learner_accounts
```

Only baseline after verifying that all four learner tables, indexes, RLS policies, and grants already exist.

To make a schema change in development:

```sh
# Edit prisma/schema.prisma, then generate a migration without applying it.
npm run db:migrate:create -- --name describe_the_change

# Review the generated SQL and add any required checks, RLS, or grants.
npm run db:migrate:dev
```

Use `npm run db:migrate:status` to inspect the target. Netlify production deployments run `npm run db:migrate:deploy` before the frontend build; deploy previews only build the app and do not modify the production database. Configure `DATABASE_URL` for the Netlify production context. Never use `prisma migrate dev` or `prisma migrate reset` against production.

## Netlify

[`netlify.toml`](netlify.toml) applies production database migrations, builds the Vite app, and serves SPA routes.
