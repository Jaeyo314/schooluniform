import { NextResponse } from "next/server";
import { updateOrderPaymentByProductKey } from "@/lib/db";

type LinkPayWebhook = {
  eventType?: string;
  data?: {
    orderKey?: string;
    amount?: number;
    payment?: {
      status?: string;
      totalAmount?: number;
    } | null;
    orderItems?: Array<{
      product?: {
        productKey?: string;
      };
    }>;
  };
};

function productKeysFromWebhook(data: LinkPayWebhook["data"]) {
  return Array.from(
    new Set(
      (data?.orderItems ?? [])
        .map((item) => item.product?.productKey)
        .filter((productKey): productKey is string => Boolean(productKey)),
    ),
  );
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as LinkPayWebhook | null;

  if (!payload || payload.eventType !== "ORDER_PAYMENT_STATUS_CHANGED") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { data } = payload;
  const tossOrderKey = data?.orderKey;
  const status = data?.payment?.status;
  const amount = data?.payment?.totalAmount ?? data?.amount ?? null;
  const productKeys = productKeysFromWebhook(data);

  if (!tossOrderKey || !status || productKeys.length === 0) {
    return NextResponse.json({ ok: false, message: "Could not verify webhook order data." }, { status: 400 });
  }

  const updated = [];
  for (const productKey of productKeys) {
    const row = await updateOrderPaymentByProductKey(productKey, tossOrderKey, amount, status, payload);
    if (row) {
      updated.push(row.id);
    }
  }

  return NextResponse.json({ ok: true, updated });
}
