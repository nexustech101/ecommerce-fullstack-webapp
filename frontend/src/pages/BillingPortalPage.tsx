import { FormEvent, useState } from "react";
import { api } from "../api/client";

export function BillingPortalPage() {
  const [customerId, setCustomerId] = useState("");
  const [stripeCustomerId, setStripeCustomerId] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function openPortal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);

    try {
      const session = await api.createPortalSession({
        customer_id: customerId ? Number(customerId) : undefined,
        stripe_customer_id: stripeCustomerId || undefined,
        return_url: window.location.origin
      });
      window.location.assign(session.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-page">
      <div>
        <p className="eyebrow">Customer self-service</p>
        <h1>Open the Stripe Billing Portal</h1>
        <p className="muted">Use either local customer ID or Stripe customer ID, depending on backend lookup support.</p>
      </div>
      <form className="panel form-card" onSubmit={openPortal}>
        <label>
          Customer ID
          <input inputMode="numeric" value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="123" />
        </label>
        <label>
          Stripe customer ID
          <input value={stripeCustomerId} onChange={(event) => setStripeCustomerId(event.target.value)} placeholder="cus_..." />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary-button" disabled={loading || (!customerId && !stripeCustomerId)}>
          {loading ? "Opening..." : "Open portal"}
        </button>
      </form>
    </section>
  );
}
