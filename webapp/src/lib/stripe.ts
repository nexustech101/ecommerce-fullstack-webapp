type EmbeddedCheckoutInstance = {
  mount: (selector: string) => void;
  destroy: () => void;
};

type StripeInstance = {
  initEmbeddedCheckout: (options: { clientSecret: string }) => Promise<EmbeddedCheckoutInstance>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

export async function loadStripeJs(): Promise<void> {
  if (window.Stripe) return;

  let script = document.getElementById("stripe-js") as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = "stripe-js";
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    document.head.appendChild(script);
  }

  if (window.Stripe) return;

  await new Promise<void>((resolve, reject) => {
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Stripe.js failed to load.")), {
      once: true,
    });
  });
}

export async function mountEmbeddedCheckout(
  clientSecret: string,
  publishableKey: string,
  selector: string,
): Promise<EmbeddedCheckoutInstance> {
  await loadStripeJs();
  if (!window.Stripe) {
    throw new Error("Stripe.js failed to initialize.");
  }
  const stripe = window.Stripe(publishableKey);
  const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
  checkout.mount(selector);
  return checkout;
}
