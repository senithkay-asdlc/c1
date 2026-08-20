import { Link, useNavigate } from "react-router-dom";
import { ShopNavbar } from "../components/ShopNavbar";
import { useCart } from "../contexts/CartContext";
import { formatMoney } from "../lib/money";

export function Cart() {
  const { cart, loading, subtotal, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const items = cart?.items ?? [];

  return (
    <div>
      <ShopNavbar />
      <main className="page">
        <h1>Your Cart</h1>
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <div>
            <p>Your cart is empty.</p>
            <Link to="/">Continue shopping</Link>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.name ?? item.productId}</td>
                    <td>{formatMoney(item.unitPrice ?? 0)}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          if (qty >= 1) void updateItem(item.productId, qty);
                        }}
                        className="qty-input"
                      />
                    </td>
                    <td>{formatMoney((item.unitPrice ?? 0) * item.quantity)}</td>
                    <td>
                      <button type="button" onClick={() => void removeItem(item.productId)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="page-row page-row-right-only">
              <p className="total-line">Subtotal: {formatMoney(subtotal)}</p>
            </div>
            <div className="page-row page-row-right-only">
              <button type="button" onClick={() => navigate("/")}>
                Continue shopping
              </button>
              <button type="button" className="btn-primary" onClick={() => navigate("/checkout")}>
                Proceed to checkout
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
