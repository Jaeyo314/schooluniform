import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { OrderInput } from "./pricing";

type Sql = NeonQueryFunction<false, false>;

let sqlClient: Sql | null | undefined;
let schemaReady = false;

function getSql() {
  if (sqlClient !== undefined) {
    return sqlClient;
  }

  const url = process.env.DATABASE_URL;
  sqlClient = url ? neon(url) : null;
  return sqlClient;
}

export type StoredOrder = {
  id: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_phone: string;
  size: string;
  jersey_number: string | null;
  initial_text: string | null;
  pants_enabled: boolean;
  long_sleeve_enabled: boolean;
  amount: number;
  status: string;
  payment_reference: string | null;
  payment_url: string | null;
  provider_order_key: string | null;
  payment_approved_at: string | null;
};

export function hasDatabase() {
  return Boolean(getSql());
}

export async function ensureSchema() {
  const sql = getSql();
  if (!sql || schemaReady) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS uniform_orders (
      id uuid PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      customer_name text NOT NULL,
      customer_phone text NOT NULL,
      size text NOT NULL,
      jersey_number text,
      initial_text text,
      pants_enabled boolean NOT NULL,
      long_sleeve_enabled boolean NOT NULL,
      amount integer NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      payment_reference text,
      payment_url text,
      provider_order_key text,
      payment_approved_at timestamptz,
      raw_payment jsonb
    )
  `;

  await sql`ALTER TABLE uniform_orders ADD COLUMN IF NOT EXISTS payment_reference text`;
  await sql`ALTER TABLE uniform_orders ADD COLUMN IF NOT EXISTS payment_url text`;
  await sql`ALTER TABLE uniform_orders ADD COLUMN IF NOT EXISTS provider_order_key text`;
  await sql`CREATE INDEX IF NOT EXISTS uniform_orders_created_idx ON uniform_orders (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS uniform_orders_payment_reference_idx ON uniform_orders (payment_reference)`;
  schemaReady = true;
}

export async function insertOrder(id: string, order: OrderInput, amount: number) {
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }
  await ensureSchema();

  const rows = await sql`
    INSERT INTO uniform_orders (
      id,
      customer_name,
      customer_phone,
      size,
      jersey_number,
      initial_text,
      pants_enabled,
      long_sleeve_enabled,
      amount
    )
    VALUES (
      ${id},
      ${order.customerName},
      ${order.customerPhone},
      ${order.size},
      ${order.numberEnabled ? order.numberText : null},
      ${order.initialEnabled ? order.initialText : null},
      ${order.pantsEnabled},
      ${order.longSleeveEnabled},
      ${amount}
    )
    RETURNING *
  `;

  return rows[0] as StoredOrder;
}

export async function attachPaymentLink(id: string, paymentReference: string, paymentUrl: string) {
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }
  await ensureSchema();

  const rows = await sql`
    UPDATE uniform_orders
    SET payment_reference = ${paymentReference},
        payment_url = ${paymentUrl},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  return rows[0] as StoredOrder;
}

export async function listOrders() {
  const sql = getSql();
  if (!sql) {
    return [] as StoredOrder[];
  }
  await ensureSchema();

  const rows = await sql`
    SELECT *
    FROM uniform_orders
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return rows as StoredOrder[];
}

export async function markPaidByPaymentReference(paymentReference: string, providerOrderKey: string, rawPayment: unknown) {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  await ensureSchema();

  const rows = await sql`
    UPDATE uniform_orders
    SET status = 'paid',
        provider_order_key = ${providerOrderKey},
        payment_approved_at = now(),
        raw_payment = ${JSON.stringify(rawPayment)}::jsonb,
        updated_at = now()
    WHERE payment_reference = ${paymentReference}
    RETURNING *
  `;

  return (rows[0] as StoredOrder | undefined) ?? null;
}

export async function updateOrderPaymentByReference(
  paymentReference: string,
  providerOrderKey: string,
  amount: number | null,
  status: string,
  rawPayment: unknown,
) {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  await ensureSchema();

  const normalizedStatus =
    status === "DONE" || status === "paid"
      ? "paid"
      : status === "CANCELED" || status === "canceled"
        ? "canceled"
        : status === "PARTIAL_CANCELED" || status === "partial_canceled"
          ? "partial_canceled"
          : status === "expired"
            ? "expired"
            : "pending";

  const rows = await sql`
    UPDATE uniform_orders
    SET status = ${normalizedStatus},
        provider_order_key = ${providerOrderKey},
        payment_approved_at = ${normalizedStatus === "paid" ? new Date().toISOString() : null},
        raw_payment = ${JSON.stringify(rawPayment)}::jsonb,
        updated_at = now()
    WHERE payment_reference = ${paymentReference}
      AND (${amount}::integer IS NULL OR amount = ${amount})
    RETURNING *
  `;

  return (rows[0] as StoredOrder | undefined) ?? null;
}
