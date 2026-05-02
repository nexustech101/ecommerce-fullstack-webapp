import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export function EmbeddedCheckoutPage() {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get("client_secret");
  const sessionId = searchParams.get("session_id");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    api
      .getBillingConfig()
      .then((config) => {
        if (!config.embedded_checkout_enabled) {
          throw new Error("Embedded checkout is not enabled by the API.");
        }
        setStripePromise(loadStripe(config.publishable_key));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to initialize Stripe"));
  }, []);

  const options = useMemo(() => {
    if (!clientSecret) return undefined;
    return { clientSecret };
  }, [clientSecret]);

  if (!clientSecret) {
    return (
      <section className="panel narrow-panel">
        <h1>Checkout session missing</h1>
        <p className="muted">Start from your cart to create a Stripe Checkout Session.</p>
        <Link className="primary-link" to="/">Return to shop</Link>
      </section>
    );
  }

  return (
    <section className="embedded-page">
      <div className="section-heading">
        <p className="eyebrow">Secure payment</p>
        <h1>Complete checkout</h1>
        {sessionId ? <p className="muted">Session {sessionId}</p> : null}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {!stripePromise || !options ? <p>Loading Stripe Checkout...</p> : null}
      {stripePromise && options ? (
        <div className="stripe-frame">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) : null}
    </section>
  );
}
