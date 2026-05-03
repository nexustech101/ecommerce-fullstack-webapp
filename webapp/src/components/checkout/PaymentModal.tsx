import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, Loader2, X } from "lucide-react";
import { billingApi } from "../../api/billing";
import { paypalApi } from "../../api/paypal";
import { ApiError } from "../../api/client";
import type { BillingLineItem, GuestCheckoutCustomer } from "../../types";
import { mountEmbeddedCheckout } from "../../lib/stripe";

type CheckoutIdentity =
  | { customer_id: number; guest?: never }
  | { customer_id?: never; guest: GuestCheckoutCustomer };

type PaymentModalProps = {
  open: boolean;
  totalPrice: number;
  checkoutItems: BillingLineItem[];
  identity: CheckoutIdentity;
  onClose: () => void;
};

type EmbeddedCheckoutHandle = {
  destroy: () => void;
};

export function PaymentModal({
  open,
  totalPrice,
  checkoutItems,
  identity,
  onClose,
}: PaymentModalProps) {
  const [creatingStripeSession, setCreatingStripeSession] = useState(false);
  const [creatingPaypalOrder, setCreatingPaypalOrder] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<EmbeddedCheckoutHandle | null>(null);
  const [activeMethod, setActiveMethod] = useState<"stripe" | "paypal" | null>(null);

  useEffect(() => {
    if (!open) return;
    return () => {
      checkout?.destroy();
    };
  }, [checkout, open]);

  useEffect(() => {
    if (open) return;
    checkout?.destroy();
    setCheckout(null);
    setSessionId(null);
    setError(null);
    setActiveMethod(null);
    setCreatingStripeSession(false);
    setCreatingPaypalOrder(false);
  }, [checkout, open]);

  if (!open) return null;

  async function startStripePayment() {
    checkout?.destroy();
    setCheckout(null);
    setError(null);
    setSessionId(null);
    setActiveMethod("stripe");
    setCreatingStripeSession(true);

    try {
      const config = await billingApi.getConfig();
      const session = await billingApi.createCheckoutSession({
        mode: "payment",
        ...identity,
        items: checkoutItems,
      });
      setSessionId(session.session_id);
      const mounted = await mountEmbeddedCheckout(
        session.client_secret,
        config.publishable_key,
        "#stripe-payment-modal-checkout",
      );
      setCheckout(mounted);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start Stripe checkout.");
    } finally {
      setCreatingStripeSession(false);
    }
  }

  async function startPaypalPayment() {
    checkout?.destroy();
    setCheckout(null);
    setSessionId(null);
    setActiveMethod("paypal");
    setError(null);
    setCreatingPaypalOrder(true);

    try {
      const order = await paypalApi.createOrder({
        ...identity,
        items: checkoutItems,
      });
      if (!order.approval_url) {
        throw new Error("PayPal did not return an approval URL.");
      }
      window.location.assign(order.approval_url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start PayPal checkout.");
      setCreatingPaypalOrder(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-stone-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <section
          className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-stone-700 bg-stone-950 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-stone-800 px-6 py-5">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.3em] text-amber-500">
                Secure payment
              </p>
              <h2 id="payment-modal-title" className="font-display text-3xl text-amber-100">
                Choose payment method
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Total due: <span className="text-stone-200">${totalPrice.toFixed(2)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm p-2 text-stone-500 transition-colors hover:bg-stone-900 hover:text-amber-100"
              aria-label="Close payment modal"
            >
              <X size={20} />
            </button>
          </header>

          <div className="overflow-y-auto px-6 py-6">
            {!sessionId && (
              <div className="mx-auto max-w-md space-y-3">
                <button
                  onClick={startStripePayment}
                  disabled={creatingStripeSession}
                  className="flex w-full items-center justify-center gap-3 rounded-sm bg-amber-500 px-5 py-4 text-sm font-semibold uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
                >
                  {creatingStripeSession ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  {creatingStripeSession ? "Opening Stripe..." : "Pay with Stripe"}
                </button>

                <button
                  onClick={startPaypalPayment}
                  disabled={creatingPaypalOrder}
                  className="flex w-full items-center justify-center gap-3 rounded-sm bg-[#ffc439] px-5 py-4 text-sm font-bold uppercase tracking-widest text-[#003087] transition-colors hover:bg-[#ffb823] disabled:opacity-60"
                >
                  {creatingPaypalOrder && <Loader2 size={16} className="animate-spin" />}
                  {creatingPaypalOrder ? "Opening PayPal..." : "Pay with PayPal"}
                </button>

                <p className="text-center text-xs leading-relaxed text-stone-600">
                  Stripe opens embedded checkout in this modal. PayPal redirects to PayPal approval,
                  then returns here for backend capture and order confirmation.
                </p>
              </div>
            )}

            {error && (
              <div className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-sm border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {sessionId && (
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs text-stone-500">Stripe session: {sessionId}</p>
                <button
                  onClick={() => {
                    checkout?.destroy();
                    setCheckout(null);
                    setSessionId(null);
                    setActiveMethod(null);
                  }}
                  className="text-xs text-stone-600 transition-colors hover:text-amber-100"
                >
                  Change payment method
                </button>
              </div>
            )}

            {activeMethod === "stripe" && creatingStripeSession && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 size={28} className="animate-spin text-amber-500" />
              </div>
            )}

            <div
              id="stripe-payment-modal-checkout"
              className={sessionId ? "overflow-hidden rounded-sm bg-white" : "hidden"}
            />
          </div>
        </section>
      </div>
    </>
  );
}
