import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { AdminShell } from "../../components/AdminShell";
import { formatMoney } from "../../lib/money";
import type { components } from "../../generated/ceramics-api";

type Product = components["schemas"]["Product"];

export function AdminCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .GET("/products", { params: { query: { limit: 100 } } })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          return;
        }
        setProducts(data?.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const lowStockCount = products.filter((p) => p.lowStock).length;

  return (
    <AdminShell>
      <div className="page-row">
        <h1>Catalog</h1>
        <div className="page-row-right">
          <Link to="/admin/products/new" className="btn-primary">
            New product
          </Link>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading products…</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/admin/products/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>{formatMoney(p.price)}</td>
                  <td>
                    {p.stockQty}
                    {p.stockQty <= 0 && <span className="badge badge-danger">Out of stock</span>}
                    {p.stockQty > 0 && p.lowStock && (
                      <span className="badge badge-warning">Low stock</span>
                    )}
                  </td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lowStockCount > 0 && (
            <span className="badge badge-warning">
              {lowStockCount} product{lowStockCount === 1 ? "" : "s"} low on stock
            </span>
          )}
        </>
      )}
    </AdminShell>
  );
}
