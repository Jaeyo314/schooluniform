import { NextResponse } from "next/server";
import { markPaidByProductKey } from "@/lib/db";
import { findPaidProductKeys, listTossOrders } from "@/lib/toss-linkpay";

export async function POST(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ message: "Admin authentication is required." }, { status: 401 });
  }

  try {
    const tossOrders = await listTossOrders();
    const paid = findPaidProductKeys(tossOrders);
    let updated = 0;

    for (const [productKey, order] of paid) {
      const row = await markPaidByProductKey(productKey, order.orderKey, order);
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
