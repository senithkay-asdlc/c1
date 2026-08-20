import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { AdminShell } from "../../components/AdminShell";

export function AdminProductForm() {
  const { productId } = useParams<{ productId: string }>();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [category, setCategory] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    void api
      .GET("/products/{productId}", { params: { path: { productId } } })
      .then(({ data }) => {
        if (!data) return;
        setName(data.name);
        setDescription(data.description ?? "");
        setPrice(String(data.price));
        setStockQty(String(data.stockQty));
        setCategory(data.category ?? "");
        setImagesText((data.images ?? []).join(", "));
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const parsedImages = () =>
    imagesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      category: category.trim() || undefined,
      stockQty: Number(stockQty),
      images: parsedImages(),
    };
    try {
      if (isEdit && productId) {
        const { error: err } = await api.PATCH("/products/{productId}", {
          params: { path: { productId } },
          body,
        });
        if (err) {
          setError(err.message);
          return;
        }
      } else {
        const { error: err } = await api.POST("/products", { body });
        if (err) {
          setError(err.message);
          return;
        }
      }
      navigate("/admin");
    } catch {
      setError("Could not save this product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async () => {
    if (!productId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await api.DELETE("/products/{productId}", {
        params: { path: { productId } },
      });
      if (err) {
        setError(err.message);
        return;
      }
      navigate("/admin");
    } catch {
      setError("Could not retire this product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <p>Loading…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <p className="breadcrumb">
        <Link to="/admin">Catalog</Link> / {isEdit ? name || "Edit product" : "New product"}
      </p>
      <h1>{isEdit ? "Edit Product" : "New Product"}</h1>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="field-row">
        <input
          placeholder="Price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          placeholder="Stock quantity"
          type="number"
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
        />
      </div>
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        placeholder="Photo URLs, comma-separated"
        value={imagesText}
        onChange={(e) => setImagesText(e.target.value)}
      />
      {error && <p className="error-text">{error}</p>}
      <div className="page-row page-row-right-only">
        {isEdit && (
          <button type="button" onClick={() => void handleRetire()} disabled={saving}>
            Retire product
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          disabled={saving || !name.trim() || !price || !stockQty}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </AdminShell>
  );
}
