"use server";

export async function syncPayments(secret: string) {
  const baseUrl =
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/admin/sync`, {
    method: "POST",
    headers: {
      "x-admin-secret": secret,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as { updated?: number; message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Could not sync payments.");
  }

  return data.updated ?? 0;
}
