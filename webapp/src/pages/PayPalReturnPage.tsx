import { useEffect, useState } from "react";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { paypalApi } from "../api/paypal";
import { ApiError } from "../api/client";
import { useCart } from "../context/CartContext";
import type { PayPalCaptureResponse } from "../types";

type PayPalReturnPageProps = {
  paypalOrderId: string;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function PayPalReturnPage({ paypalOrderId, onNavigate }: PayPalReturnPageProps) {
  const { clearCart } = useCart();
  const [capture, setCapture] = useState<PayPalCaptureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paypalOrderId) {
      setError("No PayPal order token was provided.");
      setLoading(false);
      return;
    }

    paypalApi
      .captureOrder(paypalOrderId)
      .then((result) => {
        setCapture(result);
        if (result.status === "COMPLETED") clearCart();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to capture PayPal order."))
      .finally(() => setLoading(false));
  }, [paypalOrderId, clearCart]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-amber-500" />
        <p className="text-sm text-stone-400">Capturing your PayPal payment...</p>
      </div>
    );
  }

  const completed = capture?.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {error ? (
        <>
          <XCircle size={48} className="mx-auto mb-6 text-red-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">PayPal payment failed</h1>
          <p className="mb-8 text-sm text-stone-400">{error}</p>
        </>
      ) : completed ? (
        <>
          <CheckCircle size={48} className="mx-auto mb-6 text-green-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">Order Confirmed</h1>
          <p className="mb-4 text-sm text-stone-400">
            Your PayPal payment was captured and your order was placed.
          </p>
          {capture?.order_id && (
            <p className="mb-8 text-xs text-stone-600">Order #{capture.order_id}</p>
          )}
        </>
      ) : (
        <>
          <Clock size={48} className="mx-auto mb-6 text-amber-500" />
          <h1 className="mb-3 font-display text-3xl text-amber-100">Payment Processing</h1>
          <p className="mb-8 text-sm text-stone-400">
            PayPal returned status {capture?.status ?? "unknown"}. Please check your order again shortly.
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
        {capture?.order_id && (
          <button
            onClick={() => onNavigate("order-detail", { orderId: capture.order_id! })}
            className="rounded-sm border border-stone-700 px-6 py-3 text-xs uppercase tracking-widest text-stone-300 transition-colors hover:border-stone-500 hover:text-amber-100"
          >
            View Order
          </button>
        )}
      </div>
    </div>
  );
}
