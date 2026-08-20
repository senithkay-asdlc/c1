import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export function ShopNavbar() {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const { cart } = useCart();
  const itemCount = (cart?.items ?? []).reduce((n, i) => n + i.quantity, 0);

  return (
    <nav className="navbar">
      <div className="navbar-brand">Ceramics Co.</div>
      <div className="navbar-links">
        <Link to="/">Catalog</Link>
        <Link to="/cart">Cart{itemCount > 0 ? ` (${itemCount})` : ""}</Link>
        {user && <Link to="/orders">My Orders</Link>}
        {isAdmin && <Link to="/admin">Admin console</Link>}
      </div>
      <div className="navbar-actions">
        {loading ? null : user ? (
          <>
            <span className="navbar-user">{user.profile?.email ?? "Signed in"}</span>
            <button type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" onClick={() => void signIn()}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
