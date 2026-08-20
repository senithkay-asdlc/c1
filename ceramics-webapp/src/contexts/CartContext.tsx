import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api";
import type { components } from "../generated/ceramics-api";

type Cart = components["schemas"]["Cart"];

const CART_ID_KEY = "ceramics_cart_id";

type CartState = {
  cart: Cart | null;
  loading: boolean;
  subtotal: number;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => void;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

async function createNewCart(): Promise<Cart | null> {
  const { data } = await api.POST("/carts");
  if (data) {
    localStorage.setItem(CART_ID_KEY, data.id);
  }
  return data ?? null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const existingId = localStorage.getItem(CART_ID_KEY);
    if (existingId) {
      const { data, response } = await api.GET("/carts/{cartId}", {
        params: { path: { cartId: existingId } },
      });
      if (data) {
        setCart(data);
        return;
      }
      if (response.status === 404) {
        localStorage.removeItem(CART_ID_KEY);
      }
    }
    const created = await createNewCart();
    setCart(created);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const ensureCartId = async (): Promise<string> => {
    if (cart) return cart.id;
    const created = await createNewCart();
    setCart(created);
    if (!created) throw new Error("Unable to start a cart");
    return created.id;
  };

  const addItem = async (productId: string, quantity: number) => {
    const cartId = await ensureCartId();
    const { data } = await api.POST("/carts/{cartId}/items", {
      params: { path: { cartId } },
      body: { productId, quantity },
    });
    if (data) setCart(data);
  };

  const updateItem = async (productId: string, quantity: number) => {
    if (!cart) return;
    const { data } = await api.PATCH("/carts/{cartId}/items/{productId}", {
      params: { path: { cartId: cart.id, productId } },
      body: { productId, quantity },
    });
    if (data) setCart(data);
  };

  const removeItem = async (productId: string) => {
    if (!cart) return;
    await api.DELETE("/carts/{cartId}/items/{productId}", {
      params: { path: { cartId: cart.id, productId } },
    });
    await refresh();
  };

  const clear = () => {
    localStorage.removeItem(CART_ID_KEY);
    setCart(null);
    void refresh();
  };

  const subtotal = (cart?.items ?? []).reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
    0,
  );

  const value: CartState = {
    cart,
    loading,
    subtotal,
    addItem,
    updateItem,
    removeItem,
    clear,
    refresh,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart() must be used inside <CartProvider>");
  return ctx;
}
