import { hasDatabase, listOrders } from "@/lib/db";
import { formatWon } from "@/lib/pricing";
import SyncButton from "./sync-button";

type AdminPageProps = {
  searchParams: Promise<{
    secret?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "paid") {
    return "Paid";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  if (status === "partial_canceled") {
    return "Partially canceled";
  }
  return "Pending";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const secret = params.secret ?? "";
  const isAuthed = Boolean(process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET);
  const databaseReady = hasDatabase();
  const orders = isAuthed && databaseReady ? await listOrders() : [];

  return (
    <main className="admin-shell">
      <section className="admin-top">
        <div>
          <p className="eyebrow">Class Uniform Admin</p>
          <h1>Order Management</h1>
        </div>
        {isAuthed ? <SyncButton secret={secret} /> : null}
      </section>

      {!isAuthed ? (
        <form className="admin-form" action="/admin">
          <input name="secret" type="password" placeholder="Admin secret" />
          <button className="primary-button" type="submit">
            Sign in
          </button>
        </form>
      ) : null}

      {isAuthed && !databaseReady ? (
        <p className="status-message error">DATABASE_URL is not configured, so orders cannot be viewed.</p>
      ) : null}

      {isAuthed && databaseReady ? (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Order date</th>
                <th>Customer</th>
                <th>Options</th>
                <th>Amount</th>
                <th>Payment link</th>
                <th>Toss order</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className={`badge ${order.status}`}>{statusLabel(order.status)}</span>
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <strong>{order.customer_name}</strong>
                    <br />
                    <span className="muted">{order.customer_phone}</span>
                  </td>
                  <td>
                    {order.size} / Back number {order.jersey_number ?? "-"} / Initial{" "}
                    {order.initial_text ?? "-"} / {order.pants_enabled ? "Shorts added" : "Top only"} /{" "}
                    {order.long_sleeve_enabled ? "Long sleeve" : "Short sleeve"}
                  </td>
                  <td>{formatWon(order.amount)}</td>
                  <td>
                    {order.payment_url ? (
                      <a href={order.payment_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </td>
                  <td>{order.toss_order_key ?? <span className="muted">-</span>}</td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No orders have been saved yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
