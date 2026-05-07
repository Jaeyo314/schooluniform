"use client";

import { useState } from "react";

export default function SyncButton({ secret }: { secret: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function sync() {
    setPending(true);
    setMessage("Checking payment records.");

    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: {
          "x-admin-secret": secret,
        },
      });
      const data = (await response.json()) as { updated?: number; message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Sync failed");
      }
      setMessage(`Updated ${data.updated ?? 0} payment status records.`);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sync payments.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="primary-button" type="button" onClick={sync} disabled={pending}>
        {pending ? "Syncing" : "Sync Stripe Payments"}
      </button>
      {message ? <p className="status-message">{message}</p> : null}
    </div>
  );
}
