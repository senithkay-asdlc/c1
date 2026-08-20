import { Link, useLocation, useParams } from "react-router-dom";
import { ShopNavbar } from "../components/ShopNavbar";
import { formatMoney } from "../lib/money";
import type { components } from "../generated/ceramics-api";

type Order = components["schemas"]["Order"];

export function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;

  return (
    <div>
      <ShopNavbar />
      <main className="page">
        <h1>Order Confirmed</h1>
        {order ? (
          <>
            <span className="badge badge-success">Paid</span>
            <p>
              Order #{order.id} — a confirmation email is on its way.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.name ?? item.productId}</td>
                    <td>{item.quantity}</td>
                    <td>{formatMoney(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="total-line">Total paid: {formatMoney(order.total)}</p>
          </>
        ) : (
          <p>
            Order #{orderId} was placed. Its full details aren't available on a refreshed page —
            sign in to review your orders under My Orders.
          </p>
        )}
        <Link to="/" className="btn-primary">
          Back to catalog
        </Link>
      </main>
    </div>
  );
}
