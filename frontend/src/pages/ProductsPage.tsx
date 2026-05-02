import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Product } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import { formatCurrency } from "../format";
import { useCart } from "../state/CartContext";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const { addProduct, lines, subtotal, decrementProduct, removeProduct } = useCart();

  useEffect(() => {
    api
      .listProducts()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <p className="eyebrow">Stripe Embedded Checkout ready</p>
        <h1>Premium essentials with a checkout flow customers trust.</h1>
        <p>
          Browse the catalog, build a cart, and launch a secure embedded Stripe Checkout Session.
        </p>
      </section>

      <aside className="cart-panel" aria-label="Shopping cart">
        <h2>Your cart</h2>
        {lines.length === 0 ? <p className="muted">Add products to begin checkout.</p> : null}
        {lines.map((line) => (
          <div className="cart-line" key={line.product.id}>
            <div>
              <strong>{line.product.name}</strong>
              <span>{line.quantity} x {formatCurrency(line.product.price)}</span>
            </div>
            <div className="quantity-controls">
              <button onClick={() => decrementProduct(line.product.id)} aria-label={`Decrease ${line.product.name}`}>
                -
              </button>
              <button onClick={() => addProduct(line.product)} aria-label={`Increase ${line.product.name}`}>
                +
              </button>
              <button onClick={() => removeProduct(line.product.id)}>Remove</button>
            </div>
          </div>
        ))}
        <div className="cart-total">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <Link className="primary-link" aria-disabled={lines.length === 0} to={lines.length ? "/checkout" : "#"}>
          Checkout as guest
        </Link>
      </aside>

      <section className="catalog-section">
        <div className="section-heading">
          <p className="eyebrow">Catalog</p>
          <h2>Featured products</h2>
        </div>
        {loading ? <p>Loading products...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
