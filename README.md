# Class Uniform Order Website

An Apple checkout-inspired class uniform order website. Orders are saved to the database, and Stripe Checkout creates a Link-enabled payment page for checkout.

## Environment Variables

Add the following values to `.env.local` or Vercel Environment Variables.

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
ADMIN_SECRET="change-this-admin-secret"
```

- `DATABASE_URL`: Neon Postgres or another Vercel-compatible Postgres connection string
- `STRIPE_SECRET_KEY`: Stripe secret key used to create Checkout Sessions
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook endpoint signing secret
- `ADMIN_SECRET`: Secret key for the `/admin?secret=...` admin page

## Production Integration

1. Create a Neon Postgres or compatible Postgres database and set `DATABASE_URL`.
2. Create a Stripe account, enable Link in your Stripe payment method settings, and set `STRIPE_SECRET_KEY`.
3. Deploy to Vercel, then register the following URL in Stripe webhook settings.

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

Select the `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.expired` events. When a payment is approved, the order status in the database is updated to `paid`.

## Run Locally

```bash
npm install
npm run dev
```

Admin page: `/admin?secret=ADMIN_SECRET`
