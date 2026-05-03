import { useEffect, useState } from "react";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
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
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timeout: number | undefined;

    async function poll(attempt: number) {
      try {
        const nextStatus = await billingApi.getCheckoutSession(sessionId);
        if (cancelled) return;

        setStatus(nextStatus);
        setAttempts(attempt + 1);

        if (nextStatus.payment_status === "paid" || nextStatus.status === "complete") {
          clearCart();
          setLoading(false);
          return;
        }

        if (nextStatus.status === "expired" || attempt >= 5) {
          setLoading(false);
          return;
        }

        timeout = window.setTimeout(() => poll(attempt + 1), 2000);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load session.");
        setLoading(false);
      }
    }

    poll(0);
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-amber-500" />
        <p className="text-sm text-stone-400">
          Confirming your order{attempts > 1 ? ` (${attempts}/6)` : ""}...
        </p>
      </div>
    );
  }

  const isPaid = status?.payment_status === "paid" || status?.status === "complete";
  const isFailed =
    status?.status === "expired" ||
    status?.payment_status === "failed" ||
    status?.payment_status === "unpaid";

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {error ? (
        <>
          <XCircle size={48} className="mx-auto mb-6 text-red-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">Something went wrong</h1>
          <p className="mb-8 text-sm text-stone-400">{error}</p>
        </>
      ) : isPaid ? (
        <>
          <CheckCircle size={48} className="mx-auto mb-6 text-green-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">Order Confirmed</h1>
          <p className="mb-4 text-sm text-stone-400">
            Thank you! Your order has been placed successfully.
          </p>
          {status?.order_id ? (
            <p className="mb-8 text-xs text-stone-600">Order #{status.order_id}</p>
          ) : (
            <div className="mb-8 flex items-center justify-center gap-2 text-xs text-amber-600">
              <Clock size={12} />
              Order is being processed via webhook...
            </div>
          )}
        </>
      ) : isFailed ? (
        <>
          <XCircle size={48} className="mx-auto mb-6 text-red-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">Payment Incomplete</h1>
          <p className="mb-8 text-sm text-stone-400">
            Stripe did not report a completed payment for this session. If you just paid,
            check that webhook forwarding is running and try refreshing this page.
          </p>
        </>
      ) : (
        <>
          <Clock size={48} className="mx-auto mb-6 text-amber-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">Processing</h1>
          <p className="mb-8 text-sm text-stone-400">
            Your payment is being processed. Check back shortly.
          </p>
        </>
      )}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button
          onClick={() => onNavigate("home")}
          className="rounded-sm bg-amber-500 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400"
        >
          Continue Shopping
        </button>
        {status?.order_id && (
          <button
            onClick={() => onNavigate("order-detail", { orderId: status.order_id! })}
            className="rounded-sm border border-stone-700 px-6 py-3 text-xs uppercase tracking-widest text-stone-300 transition-colors hover:border-stone-500 hover:text-amber-100"
          >
            View Order
          </button>
        )}
      </div>
    </div>
  );
}
