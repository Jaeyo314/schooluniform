import { NextResponse } from "next/server";
import { insertOrder } from "@/lib/db";
import { calculateTotal, normalizeOrderInput } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const input = normalizeOrderInput(await request.json());
    const amount = calculateTotal(input);
    const orderId = crypto.randomUUID();

    const order = await insertOrder(orderId, input, amount);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Could not register order.",
      },
      { status: 400 },
    );
  }
}
