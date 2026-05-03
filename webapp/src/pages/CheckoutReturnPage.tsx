import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { billingApi } from "../api/billing";
import type { CheckoutSessionStatus } from "../types";
import { useCart } from "../context/CartContext";
import { ApiError } from "../api/client";

type CheckoutReturnPageProps = {
  sessionId: string;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function CheckoutReturnPage({ sessionId, onNavigate }: CheckoutReturnPageProps) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<CheckoutSessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setError("No session ID provided."); setLoading(false); return; }

    billingApi
      .getCheckoutSession(sessionId)
      .then((s) => {
        setStatus(s);
        if (s.payment_status === "paid" || s.status === "complete") clearCart();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load session."))
      .finally(() => setLoading(false));
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <p className="text-stone-400 text-sm">Confirming your order…</p>
      </div>
    );
  }

  const isPaid =
    status?.payment_status === "paid" || status?.status === "complete";
  const isFailed =
    status?.status === "expired" || status?.status === "open";

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      {error ? (
        <>
          <XCircle size={48} className="text-red-500 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-amber-100 mb-3">Something went wrong</h1>
          <p className="text-stone-400 text-sm mb-8">{error}</p>
        </>
      ) : isPaid ? (
        <>
          <CheckCircle size={48} className="text-green-500 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-amber-100 mb-3">Order Confirmed</h1>
          <p className="text-stone-400 text-sm mb-4">
            Thank you! Your order has been placed successfully.
          </p>
          {status?.order_id ? (
            <p className="text-xs text-stone-600 mb-8">Order #{status.order_id}</p>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 mb-8">
              <Clock size={12} />
              Order is being processed via webhook…
            </div>
          )}
        </>
      ) : isFailed ? (
        <>
          <XCircle size={48} className="text-red-500 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-amber-100 mb-3">Payment Incomplete</h1>
          <p className="text-stone-400 text-sm mb-8">
            Your payment session has expired or failed. Please try again.
          </p>
        </>
      ) : (
        <>
          <Clock size={48} className="text-amber-500 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-amber-100 mb-3">Processing</h1>
          <p className="text-stone-400 text-sm mb-8">
            Your payment is being processed. Check back shortly.
          </p>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => onNavigate("home")}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-widest uppercase rounded-sm transition-colors"
        >
          Continue Shopping
        </button>
        {status?.order_id && (
          <button
            onClick={() => onNavigate("order-detail", { orderId: status.order_id! })}
            className="px-6 py-3 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-amber-100 text-xs tracking-widest uppercase rounded-sm transition-colors"
          >
            View Order
          </button>
        )}
      </div>
    </div>
  );
}