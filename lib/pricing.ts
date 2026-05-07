export const BASE_PRICE = 12000;
export const NUMBER_PRICE = 3000;
export const INITIAL_PRICE = 2000;
export const PANTS_PRICE = 5000;

export const SIZES = ["S", "M", "L", "XL", "2XL"] as const;

export type UniformSize = (typeof SIZES)[number];

export type OrderInput = {
  customerName: string;
  customerPhone: string;
  size: UniformSize;
  numberEnabled: boolean;
  numberText: string;
  initialEnabled: boolean;
  initialText: string;
  pantsEnabled: boolean;
  longSleeveEnabled: boolean;
};

export function formatWon(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}₩`;
}

export function calculateTotal(order: Pick<OrderInput, "numberEnabled" | "initialEnabled" | "pantsEnabled">) {
  return (
    BASE_PRICE +
    (order.numberEnabled ? NUMBER_PRICE : 0) +
    (order.initialEnabled ? INITIAL_PRICE : 0) +
    (order.pantsEnabled ? PANTS_PRICE : 0)
  );
}

export function normalizeOrderInput(input: unknown): OrderInput {
  if (!input || typeof input !== "object") {
    throw new Error("Cannot create order");
  }

  const value = input as Record<string, unknown>;
  const size = String(value.size || "M");
  if (!SIZES.includes(size as UniformSize)) {
    throw new Error("Choose correct size");
  }

  const customerName = String(value.customerName || "").trim();
  const customerPhone = String(value.customerPhone || "").trim();
  if (customerName.length < 2) {
    throw new Error("Enter your name");
  }
  if (customerPhone.replace(/[^\d]/g, "").length < 8) {
    throw new Error("Enter your phone number");
  }

  const numberEnabled = Boolean(value.numberEnabled);
  const initialEnabled = Boolean(value.initialEnabled);
  const numberText = String(value.numberText || "").replace(/[^\d]/g, "").slice(0, 2);
  const initialText = String(value.initialText || "").trim().slice(0, 10);

  if (numberEnabled && !numberText) {
    throw new Error("Enter your back number");
  }
  if (initialEnabled && !initialText) {
    throw new Error("Enter your initial");
  }

  return {
    customerName,
    customerPhone,
    size: size as UniformSize,
    numberEnabled,
    numberText,
    initialEnabled,
    initialText,
    pantsEnabled: Boolean(value.pantsEnabled),
    longSleeveEnabled: Boolean(value.longSleeveEnabled),
  };
}

export function describeOrder(order: OrderInput) {
  return [
    `Size: ${order.size}`,
    `Number: ${order.numberEnabled ? order.numberText : "None"}`,
    `Initial: ${order.initialEnabled ? order.initialText : "None"}`,
    `Shorts: ${order.pantsEnabled ? "Add" : "None"}`,
    `Sleeve: ${order.longSleeveEnabled ? "Long" : "Short"}`,
  ].join(" / ");
}
