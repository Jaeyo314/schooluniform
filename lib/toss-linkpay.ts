import { describeOrder, formatWon, type OrderInput } from "./pricing";

const TOSS_API_BASE = "https://api.tosspayments.com";

type TossProduct = {
  productKey: string;
  url: string | null;
};

type TossOrder = {
  orderKey: string;
  payment?: unknown;
  orderItems?: Array<{
    product?: {
      productKey?: string;
    };
  }>;
};

function getAuthHeader() {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY is not configured.");
  }

  const encoded = Buffer.from(`${secretKey}:`, "utf8").toString("base64");
  return `Basic ${encoded}`;
}

async function tossFetch<T>(path: string, init: RequestInit) {
  const response = await fetch(`${TOSS_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Toss LinkPay request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function createPaymentLink(orderId: string, order: OrderInput, amount: number) {
  const product = await tossFetch<TossProduct>("/v1/products", {
    method: "POST",
    headers: {
      "Idempotency-Key": `uniform-${orderId}`,
    },
    body: JSON.stringify({
      name: `Class Uniform Order ${order.customerName}`,
      amount,
      description: `${describeOrder(order)} / Order ID: ${orderId} / Amount: ${formatWon(amount)}`,
      useMemo: true,
      stock: {
        quantity: 1,
      },
      deliveryPolicy: {
        amount: 0,
        period: "Delivered in bulk after the order deadline",
      },
      exchangeRefundPolicy: "Because this is a made-to-order item, changes and refunds may be limited after production begins.",
    }),
  });

  if (!product.url) {
    throw new Error("Could not receive the Toss LinkPay payment URL.");
  }

  return {
    productKey: product.productKey,
    paymentUrl: product.url,
  };
}

export async function listTossOrders() {
  const data = await tossFetch<TossOrder[] | { orders?: TossOrder[] }>("/v1/orders?limit=100", {
    method: "GET",
  });

  return Array.isArray(data) ? data : data.orders ?? [];
}

export function findPaidProductKeys(orders: TossOrder[]) {
  const paid = new Map<string, TossOrder>();

  for (const order of orders) {
    if (!order.payment) {
      continue;
    }

    for (const item of order.orderItems ?? []) {
      const productKey = item.product?.productKey;
      if (productKey) {
        paid.set(productKey, order);
      }
    }
  }

  return paid;
}
