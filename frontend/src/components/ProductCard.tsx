import type { Product } from "../api/types";
import { formatCurrency } from "../format";

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <div className="product-visual" aria-hidden="true">
        {product.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="product-copy">
        <p className="eyebrow">In stock: {product.stock}</p>
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
