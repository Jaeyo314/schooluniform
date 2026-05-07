# Class Uniform Order Website

An Apple checkout-inspired class uniform order website. Orders are saved to the database with the confirmed total amount.

## Environment Variables

Add the following values to `.env.local` or Vercel Environment Variables.

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
ADMIN_SECRET="change-this-admin-secret"
```

- `DATABASE_URL`: Neon Postgres or another Vercel-compatible Postgres connection string
- `ADMIN_SECRET`: Secret key for the `/admin?secret=...` admin page

## Production Integration

1. Create a Neon Postgres or compatible Postgres database and set `DATABASE_URL`.
2. Set `ADMIN_SECRET` to a private value for the admin page.
3. Deploy to Vercel. Orders will be saved to the database with their confirmed total amount.

## Run Locally

```bash
npm install
npm run dev
```

Admin page: `/admin?secret=ADMIN_SECRET`
