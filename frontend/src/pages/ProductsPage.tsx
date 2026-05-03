import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Product } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import { formatCurrency } from "../format";
import { useAccount } from "../state/AccountContext";
import { useCart } from "../state/CartContext";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const { customer } = useAccount();
  const { addProduct, lines, subtotal, decrementProduct, removeProduct } = useCart();

  useEffect(() => {
    api
      .listProducts()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load products"))
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = products
    .filter((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
    .sort((left, right) => {
      if (sort === "price-asc") return left.price - right.price;
      if (sort === "price-desc") return right.price - left.price;
      return right.id - left.id;
    });

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <p className="eyebrow">Spring catalog now open</p>
        <h1>Useful goods for desk, trail, kitchen, and slow weekends.</h1>
        <p>
          Browse seeded products, build a realistic cart, and test guest or account checkout through Stripe Embedded Checkout.
        </p>
        <div className="hero-stats" aria-label="Shop highlights">
          <span><strong>{products.length || "8"}</strong> sample products</span>
          <span><strong>Guest</strong> checkout ready</span>
          <span><strong>Stripe</strong> test mode</span>
        </div>
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
        {customer ? (
          <p className="account-note">Checking out as <strong>{customer.name}</strong></p>
        ) : (
          <p className="account-note"><Link to="/account">Sign in</Link> for account checkout, or continue as a guest.</p>
        )}
        <Link className="primary-link" aria-disabled={lines.length === 0} to={lines.length ? "/checkout" : "#"}>
          Checkout
        </Link>
      </aside>

      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Featured products</h2>
          </div>
          <div className="catalog-tools">
            <input
              aria-label="Search products"
              placeholder="Search products"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="featured">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>
        {loading ? <p>Loading products...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
