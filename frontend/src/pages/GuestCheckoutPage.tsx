import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency } from "../format";
import { useAccount } from "../state/AccountContext";
import { useCart } from "../state/CartContext";

export function GuestCheckoutPage() {
  const navigate = useNavigate();
  const { customer } = useAccount();
  const { lines, subtotal, checkoutItems, guest, setGuest } = useCart();
  const [name, setName] = useState(guest?.name ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [checkoutIdentity, setCheckoutIdentity] = useState<"account" | "guest">(customer ? "account" : "guest");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);

    try {
      const trimmedGuest = { name: name.trim(), email: email.trim() };
      if (checkoutIdentity === "guest") {
        setGuest(trimmedGuest);
      }
      const session = await api.createCheckoutSession({
        mode: "payment",
        customer_id: checkoutIdentity === "account" ? customer?.id : undefined,
        guest: checkoutIdentity === "guest" ? trimmedGuest : undefined,
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
        <p className="eyebrow">Checkout</p>
        <h1>Confirm your order details</h1>
        <p className="muted">Use your optional shop account or continue as a guest. Payment details are collected by Stripe.</p>
      </div>

      <div className="checkout-layout">
        <form className="panel form-card" onSubmit={handleSubmit}>
          {customer ? (
            <div className="identity-options" role="radiogroup" aria-label="Checkout identity">
              <label>
                <input
                  type="radio"
                  checked={checkoutIdentity === "account"}
                  onChange={() => setCheckoutIdentity("account")}
                />
                <span>Use account: <strong>{customer.name}</strong></span>
              </label>
              <label>
                <input
                  type="radio"
                  checked={checkoutIdentity === "guest"}
                  onChange={() => setCheckoutIdentity("guest")}
                />
                <span>Checkout as guest</span>
              </label>
            </div>
          ) : null}

          {checkoutIdentity === "guest" ? (
            <>
              <label>
                Name
                <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
              <label>
                Email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
            </>
          ) : (
            <div className="account-summary">
              <span className="account-avatar">{customer?.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{customer?.name}</strong>
                <p className="muted">{customer?.email}</p>
              </div>
            </div>
          )}
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
