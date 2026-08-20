import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="admin-shell">
      <header className="navbar">
        <div className="navbar-brand">Ceramics Co. Admin</div>
        <div className="navbar-actions">
          {user && <span className="navbar-user">{user.profile?.email}</span>}
          <Link to="/">Storefront</Link>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <div className="admin-body">
        <aside className="sidebar">
          <Link to="/admin">Catalog</Link>
          <Link to="/admin/orders">Orders</Link>
        </aside>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
