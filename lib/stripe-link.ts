import { describeOrder, formatWon, type OrderInput } from "./pricing";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status?: string | null;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  status?: string | null;
  metadata?: Record<string, string> | null;
};

type StripeList<T> = {
  data?: T[];
};

function getSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return secretKey;
}

function getSiteUrl(origin: string) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return "https://" + process.env.VERCEL_URL;
  }
  return origin;
}

async function stripeFetch<T>(path: string, init: RequestInit) {
  const response = await fetch(STRIPE_API_BASE + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + getSecretKey(),
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data &&
      typeof (data as { error?: { message?: unknown } }).error?.message === "string"
        ? String((data as { error: { message: string } }).error.message)
        : "Stripe Link Checkout request failed.";
    throw new Error(message);
  }

  return data as T;
}

export function getStripePaymentIntentId(session: StripeCheckoutSession) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }
  return session.payment_intent?.id ?? session.id;
}

export async function createPaymentLink(orderId: string, order: OrderInput, amount: number, origin: string) {
  const siteUrl = getSiteUrl(origin);
  const successUrl = new URL("/?payment=success", siteUrl);
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  const cancelUrl = new URL("/?payment=cancelled", siteUrl);
  const body = new URLSearchParams();

  body.set("mode", "payment");
  body.set("locale", "ko");
  body.set("client_reference_id", orderId);
  body.set("success_url", successUrl.toString());
  body.set("cancel_url", cancelUrl.toString());
  body.set("payment_method_types[0]", "card");
  body.set("payment_method_types[1]", "link");
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "krw");
  body.set("line_items[0][price_data][unit_amount]", String(amount));
  body.set("line_items[0][price_data][product_data][name]", "Class Uniform Order");
  body.set("line_items[0][price_data][product_data][description]", describeOrder(order) + " / Order ID: " + orderId + " / Amount: " + formatWon(amount));
  body.set("metadata[orderId]", orderId);
  body.set("metadata[provider]", "stripe_link");
  body.set("metadata[customerName]", order.customerName);
  body.set("payment_intent_data[metadata][orderId]", orderId);

  const session = await stripeFetch<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    body,
  });

  if (!session.url) {
    throw new Error("Could not receive the Stripe Link Checkout URL.");
  }

  return {
    paymentReference: session.id,
    paymentUrl: session.url,
  };
}

export async function listPaidCheckoutSessions() {
  const params = new URLSearchParams({ limit: "100" });
  const data = await stripeFetch<StripeList<StripeCheckoutSession>>("/checkout/sessions?" + params.toString(), {
    method: "GET",
  });

  return (data.data ?? []).filter((session) => session.payment_status === "paid");
}
