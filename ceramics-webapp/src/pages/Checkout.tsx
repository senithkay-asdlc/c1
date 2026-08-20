import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { ShopNavbar } from "../components/ShopNavbar";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { formatMoney } from "../lib/money";
import { estimateShippingFee } from "../lib/shipping";
import { tokenizeCard } from "../lib/payment";

export function Checkout() {
  const { user, signIn } = useAuth();
  const { cart, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = cart?.items ?? [];
  const shippingFee = estimateShippingFee(subtotal);
  const total = subtotal + shippingFee;

  const canSubmit =
    items.length > 0 &&
    fullName.trim() &&
    line1.trim() &&
    city.trim() &&
    postalCode.trim() &&
    country.trim() &&
    cardNumber.trim() &&
    expiry.trim() &&
    cvc.trim() &&
    (user || email.trim());

  const handleSubmit = async () => {
    if (!cart || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: err, response } = await api.POST("/checkout", {
        body: {
          cartId: cart.id,
          shippingAddress: {
            line1: line1.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
          },
          paymentDetails: { paymentToken: tokenizeCard(cardNumber) },
          ...(user ? {} : { email: email.trim() }),
        },
      });

      if (response.status === 402) {
        setError("Your card was declined. Please check your details or try another card.");
        return;
      }
      if (err || !data) {
        setError(err?.message ?? "Checkout failed. Please try again.");
        return;
      }

      clear();
      navigate(`/order-confirmation/${data.id}`, { state: { order: data } });
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div>
        <ShopNavbar />
        <main className="page">
          <p>Your cart is empty — add something before checking out.</p>
          <Link to="/">Back to catalog</Link>
        </main>
      </div>
    );
  }

  return (
    <div>
      <ShopNavbar />
      <main className="page">
        <p className="breadcrumb">
          <Link to="/cart">Cart</Link> / Checkout
        </p>
        <h1>Checkout</h1>
        {user ? (
          <p>Checking out as {user.profile?.email ?? "a signed-in shopper"}.</p>
        ) : (
          <p>
            Checking out as a guest —{" "}
            <button type="button" className="link-button" onClick={() => void signIn()}>
              Sign in to save your order history
            </button>
          </p>
        )}

        <div className="split-60-40">
          <div className="split-left">
            <h2>Shipping address</h2>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              placeholder="Address line 1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
            />
            <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <div className="field-row">
              <input
                placeholder="Postal code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
              <input
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            {!user && (
              <input
                placeholder="Email (for your order confirmation)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

            <h2>Payment</h2>
            <input
              placeholder="Card number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            <div className="field-row">
              <input
                placeholder="Expiry (MM/YY)"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
              <input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
            </div>
          </div>
          <div className="split-right">
            <div className="card">
              <h3>Order summary</h3>
              {items.map((item) => (
                <p key={item.productId}>
                  {item.name ?? item.productId} x{item.quantity} —{" "}
                  {formatMoney((item.unitPrice ?? 0) * item.quantity)}
                </p>
              ))}
              <p>Subtotal — {formatMoney(subtotal)}</p>
              <p>Shipping — {shippingFee === 0 ? "Free" : formatMoney(shippingFee)}</p>
              <p className="total-line">Total — {formatMoney(total)}</p>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Placing order…" : "Pay & place order"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
