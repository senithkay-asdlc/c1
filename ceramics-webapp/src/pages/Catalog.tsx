import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ShopNavbar } from "../components/ShopNavbar";
import { StockBadge } from "../components/StockBadge";
import { formatMoney } from "../lib/money";
import type { components } from "../generated/ceramics-api";

type Product = components["schemas"]["Product"];

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seed the category filter once from the unfiltered catalog.
  useEffect(() => {
    void api
      .GET("/products", { params: { query: { limit: 100 } } })
      .then(({ data }) => {
        const seen = new Set<string>();
        for (const p of data?.data ?? []) {
          if (p.category) seen.add(p.category);
        }
        setCategories(Array.from(seen).sort());
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api
      .GET("/products", {
        params: {
          query: {
            search: search || undefined,
            category: category || undefined,
            limit: 40,
          },
        },
      })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          return;
        }
        setProducts(data?.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, category]);

  const grouped = useMemo(() => {
    const rows: Product[][] = [];
    for (let i = 0; i < products.length; i += 3) {
      rows.push(products.slice(i, i + 3));
    }
    return rows;
  }, [products]);

  return (
    <div>
      <ShopNavbar />
      <main className="page">
        <div className="page-row">
          <h1>Handmade Ceramics</h1>
          <div className="page-row-right">
            <input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Category: All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        {loading ? (
          <p>Loading catalog…</p>
        ) : products.length === 0 ? (
          <p>No products match your search.</p>
        ) : (
          grouped.map((row, i) => (
            <div className="card-row" key={i}>
              {row.map((p) => (
                <Link to={`/products/${p.id}`} className="card product-card" key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="price">{formatMoney(p.price)}</p>
                  <StockBadge stockQty={p.stockQty} lowStock={p.lowStock} />
                </Link>
              ))}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
