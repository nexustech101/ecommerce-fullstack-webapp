import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CartLine, Product } from "../types";

type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: Math.min(l.quantity + quantity, product.stock) }
            : l,
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.product.id !== productId));
    } else {
      setLines((prev) =>
        prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)),
      );
    }
  }, []);

  const clearCart = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const totalPrice = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines],
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}