import { useState } from "react";
import { ArrowLeft, User, Mail } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { PaymentModal } from "../components/checkout/PaymentModal";

type CheckoutPageProps = {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

type GuestInfo = { name: string; email: string };

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { lines, totalPrice } = useCart();
  const { customer } = useAuth();

  const [guest, setGuest] = useState<GuestInfo>({ name: "", email: "" });
  const [useGuest, setUseGuest] = useState(!customer);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const guestReady = Boolean(guest.name.trim() && guest.email.trim());
  const canProceed = Boolean(customer && !useGuest) || guestReady;
  const checkoutItems = lines.map((line) => ({
    product_id: line.product.id,
    quantity: line.quantity,
  }));
  const checkoutIdentity =
    customer && !useGuest
      ? { customer_id: customer.id }
      : { guest: { name: guest.name.trim(), email: guest.email.trim() } };

  if (lines.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">Your cart is empty.</p>
        <button
          onClick={() => onNavigate("home")}
          className="text-xs text-amber-500 tracking-widest uppercase hover:text-amber-300"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => onNavigate("home")}
        className="flex items-center gap-2 text-stone-500 hover:text-amber-100 text-sm transition-colors mb-10"
      >
        <ArrowLeft size={16} />
        Back to Shop
      </button>

      <h1 className="font-display text-4xl text-amber-100 mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Order summary + identity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
            <div className="bg-stone-900 border border-stone-700 rounded-sm p-5">
              <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-4">
                Order Summary
              </h2>
              <ul className="space-y-3 divide-y divide-stone-800">
                {lines.map(({ product, quantity }) => (
                  <li key={product.id} className="flex justify-between pt-3 first:pt-0">
                    <span className="text-sm text-stone-300 truncate flex-1 pr-2">
                      {product.name}{" "}
                      <span className="text-stone-500">x {quantity}</span>
                    </span>
                    <span className="text-sm text-stone-200 flex-shrink-0">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-stone-700 mt-4 pt-4 flex justify-between">
                <span className="text-sm text-stone-400">Total</span>
                <span className="text-base font-medium text-amber-100">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Identity */}
            {customer ? (
              <div className="bg-stone-900 border border-stone-700 rounded-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs tracking-widest uppercase text-stone-400">
                    Identity
                  </h2>
                  <button
                    onClick={() => setUseGuest(!useGuest)}
                    className="text-xs text-amber-500 hover:text-amber-300 transition-colors"
                  >
                    {useGuest ? "Use account" : "Checkout as guest"}
                  </button>
                </div>
                {!useGuest ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-800 flex items-center justify-center text-sm text-amber-100 font-medium">
                      {customer.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-stone-200">{customer.name}</p>
                      <p className="text-xs text-stone-500">{customer.email}</p>
                    </div>
                  </div>
                ) : (
                  <GuestForm value={guest} onChange={setGuest} />
                )}
              </div>
            ) : (
              <div className="bg-stone-900 border border-stone-700 rounded-sm p-5">
                <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-4">
                  Your Details
                </h2>
                <GuestForm value={guest} onChange={setGuest} />
              </div>
            )}

            <button
              onClick={() => setPaymentOpen(true)}
              disabled={!canProceed}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-widest uppercase rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Proceed to Payment
            </button>
          </div>

        {/* Right: Payment preview */}
        <div className="lg:col-span-3">
          <div className="h-64 lg:h-full border border-dashed border-stone-800 rounded-sm flex items-center justify-center text-center p-8">
            <div>
              <p className="mb-2 text-sm text-stone-500">
                Payment opens in a secure modal after you choose a checkout identity.
              </p>
              <p className="text-xs text-stone-700">
                Stripe is fully integrated. PayPal requires backend create/capture endpoints.
              </p>
            </div>
          </div>
        </div>
      </div>

      {canProceed ? (
        <PaymentModal
          open={paymentOpen}
          totalPrice={totalPrice}
          checkoutItems={checkoutItems}
          identity={checkoutIdentity}
          onClose={() => setPaymentOpen(false)}
        />
      ) : null}
    </div>
  );
}

function GuestForm({
  value,
  onChange,
}: {
  value: GuestInfo;
  onChange: (v: GuestInfo) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          required
          placeholder="Full name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full pl-8 pr-3 py-2.5 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
      <div className="relative">
        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="email"
          required
          placeholder="Email address"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className="w-full pl-8 pr-3 py-2.5 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
    </div>
  );
}

