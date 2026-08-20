import { useEffect, useState } from "react";
import { ShopNavbar } from "../components/ShopNavbar";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { formatMoney } from "../lib/money";
import type { components } from "../generated/ceramics-api";

type Order = components["schemas"]["Order"];

export function OrderHistory() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void api
      .GET("/orders", { params: { query: {} } })
      .then(({ data }) => setOrders(data?.data ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <ShopNavbar />
      <main className="page">
        <h1>My Orders</h1>
        {authLoading ? (
          <p>Loading…</p>
        ) : !user ? (
          <div>
            <p>Sign in to see your past orders.</p>
            <button type="button" className="btn-primary" onClick={() => void signIn()}>
              Sign in
            </button>
          </div>
        ) : loading ? (
          <p>Loading your orders…</p>
        ) : orders.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>
                  <td>
                    <span className={`badge badge-${order.status === "fulfilled" ? "success" : "info"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{formatMoney(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
