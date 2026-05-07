import { NextResponse } from "next/server";
import { markPaidByPaymentReference } from "@/lib/db";
import { getStripePaymentIntentId, listPaidCheckoutSessions } from "@/lib/stripe-link";

export async function POST(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ message: "Admin authentication is required." }, { status: 401 });
  }

  try {
    const sessions = await listPaidCheckoutSessions();
    let updated = 0;

    for (const session of sessions) {
      const row = await markPaidByPaymentReference(session.id, getStripePaymentIntentId(session), session);
      if (row) {
        updated += 1;
      }
    }

    return NextResponse.json({ updated });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not sync payments." },
      { status: 400 },
    );
  }
}
