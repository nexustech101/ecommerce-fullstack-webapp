import { useState } from "react";
import type { Product } from "../api/types";
import { formatCurrency } from "../format";

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.image_url && !imageFailed);

  return (
    <article className="product-card">
      <div className="product-visual">
        {showImage ? (
          <img src={product.image_url ?? ""} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <div className="product-placeholder" aria-hidden="true">
            <span>{product.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <span className="stock-badge">{outOfStock ? "Sold out" : `${product.stock} available`}</span>
      </div>
      <div className="product-copy">
        <p className="eyebrow">Northstar Goods</p>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <div className="product-actions">
        <strong>{formatCurrency(product.price)}</strong>
        <button disabled={outOfStock} onClick={() => onAdd(product)}>
          {outOfStock ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
