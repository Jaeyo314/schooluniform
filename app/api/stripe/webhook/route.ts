import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { updateOrderPaymentByReference } from "@/lib/db";
import { getStripePaymentIntentId, type StripeCheckoutSession } from "@/lib/stripe-link";

export const runtime = "nodejs";

type StripeEvent = {
  type?: string;
  data?: {
    object?: StripeCheckoutSession;
  };
};

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifyStripeSignature(body: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
  return signatures.some((signature) => safeEqual(signature, expected));
}

function sessionStatus(session: StripeCheckoutSession) {
  if (session.payment_status === "paid") {
    return "paid";
  }
  if (session.status === "expired") {
    return "expired";
  }
  return "pending";
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(body, signature)) {
    return NextResponse.json({ message: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as StripeEvent;
  const session = event.data?.object;

  if (!session?.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.expired"
  ) {
    const row = await updateOrderPaymentByReference(
      session.id,
      getStripePaymentIntentId(session),
      session.amount_total ?? null,
      sessionStatus(session),
      event,
    );
    return NextResponse.json({ ok: true, updated: row ? [row.id] : [] });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
