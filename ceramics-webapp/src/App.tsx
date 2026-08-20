import { Route, Routes } from "react-router-dom";
import { Catalog } from "./pages/Catalog";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { OrderHistory } from "./pages/OrderHistory";
import { Callback } from "./pages/Callback";
import { AdminCatalog } from "./pages/admin/AdminCatalog";
import { AdminProductForm } from "./pages/admin/AdminProductForm";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { RequireAdmin } from "./components/RequireAdmin";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/products/:productId" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
      <Route path="/orders" element={<OrderHistory />} />
      <Route path="/callback" element={<Callback />} />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminCatalog />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <RequireAdmin>
            <AdminProductForm />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/products/:productId"
        element={
          <RequireAdmin>
            <AdminProductForm />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <RequireAdmin>
            <AdminOrders />
          </RequireAdmin>
        }
      />

      <Route path="*" element={<Catalog />} />
    </Routes>
  );
}
