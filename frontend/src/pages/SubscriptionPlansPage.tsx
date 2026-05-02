import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { GuestDetails, SubscriptionPlan } from "../api/types";
import { formatCurrency, normalizePrice } from "../format";

export function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [guest, setGuest] = useState<GuestDetails>({ name: "", email: "" });
  const [selectedPlanId, setSelectedPlanId] = useState<number>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    api
      .listSubscriptionPlans()
      .then(setPlans)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load subscription plans"));
  }, []);

  async function subscribe(planId: number) {
    setSelectedPlanId(planId);
    setError(undefined);
    try {
      const session = await api.createCheckoutSession({
        mode: "subscription",
        plan_id: planId,
        guest: guest.name && guest.email ? guest : undefined
      });
      navigate(`/checkout/embedded?client_secret=${encodeURIComponent(session.client_secret)}&session_id=${encodeURIComponent(session.session_id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start subscription checkout");
    } finally {
      setSelectedPlanId(undefined);
    }
  }

  return (
    <section className="plans-page">
      <div className="section-heading">
        <p className="eyebrow">Subscriptions</p>
        <h1>Choose a recurring plan</h1>
        <p className="muted">Plans are charged through Stripe Checkout in subscription mode.</p>
      </div>

      <div className="panel guest-strip">
        <label>
          Name for checkout
          <input value={guest.name} onChange={(event) => setGuest({ ...guest, name: event.target.value })} />
        </label>
        <label>
          Email for checkout
          <input type="email" value={guest.email} onChange={(event) => setGuest({ ...guest, email: event.target.value })} />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}
      <div className="plan-grid">
        {plans.map((plan) => (
          <article className="plan-card" key={plan.id}>
            <p className="eyebrow">{plan.interval ?? "recurring"}</p>
            <h2>{plan.name}</h2>
            <p>{plan.description ?? "Flexible billing for repeat customers."}</p>
            <strong className="plan-price">{formatCurrency(normalizePrice(plan), plan.currency ?? "USD")}</strong>
            <button className="primary-button" onClick={() => subscribe(plan.id)} disabled={selectedPlanId === plan.id}>
              {selectedPlanId === plan.id ? "Opening checkout..." : "Subscribe"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
