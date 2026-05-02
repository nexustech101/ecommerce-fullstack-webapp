export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

export function normalizePrice(plan: { price?: number; amount?: number }) {
  return plan.price ?? plan.amount ?? 0;
}
