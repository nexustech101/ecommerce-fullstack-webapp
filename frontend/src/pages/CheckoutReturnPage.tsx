import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { CheckoutSessionStatus } from "../api/types";
import { useCart } from "../state/CartContext";

export function CheckoutReturnPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? searchParams.get("sessionId");
  const [status, setStatus] = useState<CheckoutSessionStatus>();
  const [error, setError] = useState<string>();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!sessionId) return;
    api
      .getCheckoutSession(sessionId)
      .then((result) => {
        setStatus(result);
        if (result.payment_status === "paid" || result.status === "complete") clearCart();
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load checkout status"));
  }, [clearCart, sessionId]);

  return (
    <section className="panel narrow-panel status-card">
      <p className="eyebrow">Checkout status</p>
      <h1>{status ? "Session received" : "Reviewing your checkout"}</h1>
      {!sessionId ? <p className="error">Missing session ID in the return URL.</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {sessionId && !status && !error ? <p>Loading status...</p> : null}
      {status ? (
        <dl className="status-list">
          <div><dt>Session</dt><dd>{status.session_id}</dd></div>
          <div><dt>Status</dt><dd>{status.status}</dd></div>
          <div><dt>Payment</dt><dd>{status.payment_status}</dd></div>
          <div><dt>Mode</dt><dd>{status.mode}</dd></div>
          {status.order_id ? <div><dt>Order</dt><dd>#{status.order_id}</dd></div> : null}
          {status.subscription_id ? <div><dt>Subscription</dt><dd>#{status.subscription_id}</dd></div> : null}
        </dl>
      ) : null}
      <Link className="primary-link" to="/">Continue shopping</Link>
    </section>
  );
}
