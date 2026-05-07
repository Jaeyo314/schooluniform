# Class Uniform Order Website

An Apple checkout-inspired class uniform order website. Orders are saved to the database, and Toss Payments LinkPay creates a payment link for checkout.

## Environment Variables

Add the following values to `.env.local` or Vercel Environment Variables.

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
TOSS_SECRET_KEY="test_sk_..."
ADMIN_SECRET="change-this-admin-secret"
```

- `DATABASE_URL`: Neon Postgres or another Vercel-compatible Postgres connection string
- `TOSS_SECRET_KEY`: Secret key issued after setting up Toss Payments LinkPay
- `ADMIN_SECRET`: Secret key for the `/admin?secret=...` admin page

## Production Integration

1. Create a Neon Postgres or compatible Postgres database and set `DATABASE_URL`.
2. Set `TOSS_SECRET_KEY` after configuring Toss Payments LinkPay.
3. Deploy to Vercel, then register the following URL in the Toss Payments Developer Center webhook settings.

```text
https://YOUR_DOMAIN/api/toss/webhook
```

Select the `ORDER_PAYMENT_STATUS_CHANGED` event. When a payment is approved, the order status in the database is updated to `paid`. Canceled and partially canceled payments are also reflected in the admin page.

## Run Locally

```bash
npm install
npm run dev
```

Admin page: `/admin?secret=ADMIN_SECRET`
