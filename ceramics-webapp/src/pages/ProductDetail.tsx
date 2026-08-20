import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ShopNavbar } from "../components/ShopNavbar";
import { StockBadge } from "../components/StockBadge";
import { useCart } from "../contexts/CartContext";
import { formatMoney } from "../lib/money";
import type { components } from "../generated/ceramics-api";

type Product = components["schemas"]["Product"];

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    void api
      .GET("/products/{productId}", { params: { path: { productId } } })
      .then(({ data, response }) => {
        if (response.status === 404 || !data) {
          setNotFound(true);
          return;
        }
        setProduct(data);
      });
  }, [productId]);

  if (notFound) {
    return (
      <div>
        <ShopNavbar />
        <main className="page">
          <p>Product not found.</p>
          <Link to="/">Back to catalog</Link>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <ShopNavbar />
        <main className="page">
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  const outOfStock = product.stockQty <= 0;

  const handleAddToCart = async () => {
    setAdding(true);
    setAddError(null);
    try {
      await addItem(product.id, quantity);
      navigate("/cart");
    } catch {
      setAddError("Could not add this item to your cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <ShopNavbar />
      <main className="page">
        <p className="breadcrumb">
          <Link to="/">Catalog</Link> / {product.name}
        </p>
        <div className="split-60-40">
          <div className="split-left">
            <div className="image-placeholder">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <span>{product.name} photo</span>
              )}
            </div>
            <p>{product.description}</p>
          </div>
          <div className="split-right">
            <h1>{product.name}</h1>
            <p className="price">{formatMoney(product.price)}</p>
            <StockBadge stockQty={product.stockQty} lowStock={product.lowStock} />
            <label className="field">
              Quantity
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={outOfStock}
              >
                {Array.from({ length: Math.min(product.stockQty, 10) || 1 }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ),
                )}
              </select>
            </label>
            {addError && <p className="error-text">{addError}</p>}
            <button
              type="button"
              className="btn-primary"
              disabled={outOfStock || adding}
              onClick={() => void handleAddToCart()}
            >
              {outOfStock ? "Out of stock" : adding ? "Adding…" : "Add to cart"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
