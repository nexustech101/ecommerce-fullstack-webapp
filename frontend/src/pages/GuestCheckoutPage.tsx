import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency } from "../format";
import { useCart } from "../state/CartContext";

export function GuestCheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, checkoutItems, guest, setGuest } = useCart();
  const [name, setName] = useState(guest?.name ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);

    try {
      const trimmedGuest = { name: name.trim(), email: email.trim() };
      setGuest(trimmedGuest);
      const session = await api.createCheckoutSession({
        mode: "payment",
        guest: trimmedGuest,
        items: checkoutItems
      });
      navigate(`/checkout/embedded?client_secret=${encodeURIComponent(session.client_secret)}&session_id=${encodeURIComponent(session.session_id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create checkout session");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div>
        <p className="eyebrow">Guest checkout</p>
        <h1>Confirm your order details</h1>
        <p className="muted">Payment details are collected by Stripe in the next step.</p>
      </div>

      <div className="checkout-layout">
        <form className="panel form-card" onSubmit={handleSubmit}>
          <label>
            Name
            <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
          <label>
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary-button" disabled={submitting || lines.length === 0}>
            {submitting ? "Creating session..." : "Continue to secure checkout"}
          </button>
        </form>

        <aside className="panel order-summary">
          <h2>Order summary</h2>
          {lines.map((line) => (
            <div className="summary-line" key={line.product.id}>
              <span>{line.product.name} x {line.quantity}</span>
              <strong>{formatCurrency(line.product.price * line.quantity)}</strong>
            </div>
          ))}
          <div className="cart-total">
            <span>Total before tax/shipping</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
