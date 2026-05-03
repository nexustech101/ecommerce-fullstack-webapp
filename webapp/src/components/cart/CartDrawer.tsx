import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

type CartDrawerProps = {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function CartDrawer({ onNavigate }: CartDrawerProps) {
  const { lines, isOpen, closeCart, updateQuantity, removeFromCart, totalPrice, totalItems } =
    useCart();

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    onNavigate("checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-stone-950 border-l border-stone-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-amber-400" />
            <h2 className="font-medium text-stone-100 tracking-wide">
              Cart
              {totalItems > 0 && (
                <span className="ml-2 text-xs text-stone-400">({totalItems})</span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="text-stone-500 hover:text-amber-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <ShoppingBag size={48} className="text-stone-700 mb-4" />
              <p className="text-stone-400 text-sm">Your cart is empty.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-800/60">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 px-6 py-4">
                  {/* Image */}
                  <div className="w-16 h-20 bg-stone-900 rounded-sm flex-shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-800" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-200 leading-tight truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-stone-400 mt-0.5">${product.price.toFixed(2)}</p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 rounded-sm border border-stone-700 flex items-center justify-center text-stone-400 hover:text-amber-100 hover:border-stone-500 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm text-stone-200 w-5 text-center">{quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(product.id, Math.min(quantity + 1, product.stock))
                        }
                        disabled={quantity >= product.stock}
                        className="w-6 h-6 rounded-sm border border-stone-700 flex items-center justify-center text-stone-400 hover:text-amber-100 hover:border-stone-500 transition-colors disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="ml-auto text-stone-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="border-t border-stone-800 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-400 tracking-wide">Subtotal</span>
              <span className="text-base font-medium text-amber-100">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-stone-600">Taxes and shipping calculated at checkout.</p>
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm tracking-widest uppercase rounded-sm transition-colors"
            >
              Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}