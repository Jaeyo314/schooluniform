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
      status text NOT NULL DEFAULT 'registered'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS uniform_orders_created_idx ON uniform_orders (created_at DESC)`;
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
      amount,
      status
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
      ${amount},
      ${"registered"}
    )
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
