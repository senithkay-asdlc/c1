import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

// Security rule: an unauthenticated visitor is routed to the storefront,
// never shown any admin screen or an admin-specific sign-in page. Only a
// signed-in caller who already carries the Store Admin role reaches the
// admin console; everyone else lands back on the catalog.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
