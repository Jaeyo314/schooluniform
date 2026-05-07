import { NextResponse } from "next/server";
import { attachPaymentLink, insertOrder } from "@/lib/db";
import { calculateTotal, normalizeOrderInput } from "@/lib/pricing";
import { createPaymentLink } from "@/lib/toss-linkpay";

export async function POST(request: Request) {
  try {
    const input = normalizeOrderInput(await request.json());
    const amount = calculateTotal(input);
    const orderId = crypto.randomUUID();

    await insertOrder(orderId, input, amount);
    const payment = await createPaymentLink(orderId, input, amount);
    const order = await attachPaymentLink(orderId, payment.productKey, payment.paymentUrl);

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
