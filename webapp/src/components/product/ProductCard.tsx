import { useState } from "react";
import { ShoppingBag, ImageOff } from "lucide-react";
import type { Product } from "../../types";
import { useCart } from "../../context/CartContext";

type ProductCardProps = {
  product: Product;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function ProductCard({ product, onNavigate }: ProductCardProps) {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => onNavigate("product", { id: product.id })}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-stone-900 overflow-hidden rounded-sm mb-4">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={32} className="text-stone-700" />
          </div>
        )}

        {/* Out-of-stock badge */}
        {outOfStock && (
          <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-stone-300 bg-stone-900/80 px-3 py-1">
              Sold Out
            </span>
          </div>
        )}

        {/* Add to cart overlay */}
        {!outOfStock && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={14} />
              {added ? "Added!" : "Add to Cart"}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-stone-200 group-hover:text-amber-100 transition-colors leading-tight">
          {product.name}
        </h3>
        <p className="text-sm text-stone-400">
          ${product.price.toFixed(2)}
        </p>
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-amber-600">Only {product.stock} left</p>
        )}
      </div>
    </div>
  );
}