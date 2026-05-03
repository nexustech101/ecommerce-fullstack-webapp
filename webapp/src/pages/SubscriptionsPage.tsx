import { useEffect, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { billingApi } from "../api/billing";
import type { SubscriptionPlan } from "../types";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { mountEmbeddedCheckout } from "../lib/stripe";

type SubscriptionsPageProps = {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function SubscriptionsPage(_props: SubscriptionsPageProps) {
  void _props;
  const { customer } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [subError, setSubError] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [stripeCheckout, setStripeCheckout] = useState<{ destroy: () => void } | null>(null);

  useEffect(() => {
    billingApi
      .getSubscriptionPlans()
      .then(setPlans)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load plans."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      stripeCheckout?.destroy();
    };
  }, [stripeCheckout]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!customer) {
      setSubError("Please sign in to subscribe.");
      return;
    }
    setSubError(null);
    setSubscribing(plan.id);
    try {
      const config = await billingApi.getConfig();
      const session = await billingApi.createCheckoutSession({
        mode: "subscription",
        customer_id: customer.id,
        plan_id: plan.id,
      });
      setCheckoutSessionId(session.session_id);
      const checkout = await mountEmbeddedCheckout(
        session.client_secret,
        config.publishable_key,
        "#subscription-stripe-checkout",
      );
      setStripeCheckout(checkout);
    } catch (err) {
      setSubError(err instanceof ApiError ? err.message : "Failed to start subscription.");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <p className="text-xs tracking-[0.4em] uppercase text-amber-500 mb-4">Recurring</p>
        <h1 className="font-display text-5xl md:text-6xl text-amber-100 leading-none mb-6">
          Subscribe & Save
        </h1>
        <p className="text-stone-400 max-w-md mx-auto text-sm leading-relaxed">
          Monthly curated boxes delivered to your door. Cancel anytime.
        </p>
        {checkoutSessionId ? (
          <p className="text-xs text-stone-600 mt-3">Session: {checkoutSessionId}</p>
        ) : null}
      </div>

      <div
        id="subscription-stripe-checkout"
        className={checkoutSessionId ? "bg-white rounded-sm overflow-hidden mb-12" : "hidden"}
      />

      {checkoutSessionId ? (
        <div className="text-center mb-12">
          <button
            onClick={() => {
              stripeCheckout?.destroy();
              setStripeCheckout(null);
              setCheckoutSessionId(null);
            }}
            className="text-xs text-stone-500 hover:text-amber-100 transition-colors"
          >
            Choose a different plan
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-amber-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 justify-center py-16 text-red-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : (
        <>
          {subError && (
            <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/40 rounded-sm px-4 py-3 mb-8 text-sm text-red-400">
              <AlertCircle size={16} />
              {subError}
            </div>
          )}

          <div className={checkoutSessionId ? "hidden" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-stone-900 border border-stone-700 hover:border-amber-800 rounded-sm p-8 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-900/40 rounded-sm flex items-center justify-center">
                    <RefreshCw size={18} className="text-amber-500" />
                  </div>
                  <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-sm tracking-widest uppercase">
                    Monthly
                  </span>
                </div>
                <h2 className="font-display text-2xl text-amber-100 mb-2">{plan.name}</h2>
                <p className="text-sm text-stone-500 leading-relaxed mb-6">{plan.description}</p>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribing === plan.id}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-widest uppercase rounded-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {subscribing === plan.id && <Loader2 size={13} className="animate-spin" />}
                  {subscribing === plan.id ? "Loading…" : "Subscribe Now"}
                </button>
              </div>
            ))}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-16">
              <p className="text-stone-600 text-sm">No subscription plans available.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
