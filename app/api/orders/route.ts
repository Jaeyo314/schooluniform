import { NextResponse } from "next/server";
import { attachPaymentLink, insertOrder } from "@/lib/db";
import { calculateTotal, normalizeOrderInput } from "@/lib/pricing";
import { createPaymentLink } from "@/lib/stripe-link";

export async function POST(request: Request) {
  try {
    const input = normalizeOrderInput(await request.json());
    const amount = calculateTotal(input);
    const orderId = crypto.randomUUID();

    await insertOrder(orderId, input, amount);
    const origin = new URL(request.url).origin;
    const payment = await createPaymentLink(orderId, input, amount, origin);
    const order = await attachPaymentLink(orderId, payment.paymentReference, payment.paymentUrl);

    return NextResponse.json({
      orderId: order.id,
      amount,
      paymentUrl: payment.paymentUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Could not create order.",
      },
      { status: 400 },
    );
  }
}
