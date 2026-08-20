import { useEffect, useState } from "react";
import { api } from "../../api";
import { AdminShell } from "../../components/AdminShell";
import { formatMoney } from "../../lib/money";
import type { components } from "../../generated/ceramics-api";

type Order = components["schemas"]["Order"];
type Tab = "all" | "paid" | "fulfilled";

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    void api
      .GET("/orders", {
        params: { query: { status: tab === "all" ? undefined : tab, limit: 100 } },
      })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          return;
        }
        setOrders(data?.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const handleFulfill = async (orderId: string) => {
    setFulfilling(orderId);
    setError(null);
    try {
      const { data, error: err } = await api.POST("/orders/{orderId}/fulfill", {
        params: { path: { orderId } },
      });
      if (err || !data) {
        setError(err?.message ?? "Could not mark this order fulfilled.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)));
    } finally {
      setFulfilling(null);
    }
  };

  return (
    <AdminShell>
      <h1>Orders</h1>
      <div className="tabs">
        {(["all", "paid", "fulfilled"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={t === tab ? "tab-active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading orders…</p>
      ) : orders.length === 0 ? (
        <p>No orders in this view.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customerId ?? "guest"}</td>
                <td>{formatMoney(order.total)}</td>
                <td>
                  <span className={`badge badge-${order.status === "fulfilled" ? "success" : "info"}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  {order.status === "fulfilled" ? (
                    "Fulfilled"
                  ) : (
                    <button
                      type="button"
                      disabled={fulfilling === order.id}
                      onClick={() => void handleFulfill(order.id)}
                    >
                      {fulfilling === order.id ? "Marking…" : "Mark fulfilled"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}
