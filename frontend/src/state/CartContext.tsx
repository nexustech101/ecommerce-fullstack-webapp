import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CheckoutItem, GuestDetails, Product } from "../api/types";

type CartLine = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  guest?: GuestDetails;
  addProduct: (product: Product) => void;
  decrementProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  clearCart: () => void;
  setGuest: (guest: GuestDetails) => void;
  checkoutItems: CheckoutItem[];
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [guest, setGuest] = useState<GuestDetails>();

  const value = useMemo<CartContextValue>(() => {
    const checkoutItems = lines.map(({ product, quantity }) => ({
      product_id: product.id,
      quantity
    }));

    return {
      lines,
      guest,
      addProduct(product) {
        setLines((current) => {
          const existing = current.find((line) => line.product.id === product.id);
          if (!existing) return [...current, { product, quantity: 1 }];
          return current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) }
              : line
          );
        });
      },
      decrementProduct(productId) {
        setLines((current) =>
          current
            .map((line) =>
              line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line
            )
            .filter((line) => line.quantity > 0)
        );
      },
      removeProduct(productId) {
        setLines((current) => current.filter((line) => line.product.id !== productId));
      },
      clearCart() {
        setLines([]);
      },
      setGuest,
      checkoutItems,
      subtotal: lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0)
    };
  }, [guest, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
