import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { ordersApi } from "../api/orders";
import type { OrderDetail } from "../types";
import { ApiError } from "../api/client";

type OrderDetailPageProps = {
  orderId: number;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function OrderDetailPage({ orderId, onNavigate }: OrderDetailPageProps) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .get(orderId)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
        <p className="text-stone-400 text-sm">{error ?? "Order not found."}</p>
        <button onClick={() => onNavigate("orders")} className="mt-4 text-xs text-amber-500 tracking-widest uppercase">
          Back to Orders
        </button>
      </div>
    );
  }

  const { order, items, payments } = detail;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => onNavigate("orders")}
        className="flex items-center gap-2 text-stone-500 hover:text-amber-100 text-sm transition-colors mb-10"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </button>

      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl text-amber-100">Order #{order.id}</h1>
          <p className="text-stone-500 text-sm mt-1">
            {new Date(order.created_at).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <span className="text-lg font-medium text-amber-100">${order.total_amount.toFixed(2)}</span>
      </div>

      {/* Items */}
      <div className="bg-stone-900 border border-stone-700 rounded-sm p-6 mb-6">
        <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Items</h2>
        <ul className="divide-y divide-stone-800">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm text-stone-200">Product #{item.product_id}</p>
                <p className="text-xs text-stone-500">× {item.quantity}</p>
              </div>
              <p className="text-sm text-stone-300">${item.price.toFixed(2)} ea.</p>
            </li>
          ))}
        </ul>
        <div className="border-t border-stone-800 mt-4 pt-4 flex justify-between">
          <span className="text-sm text-stone-400">Total</span>
          <span className="text-sm font-medium text-amber-100">${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <div className="bg-stone-900 border border-stone-700 rounded-sm p-6">
          <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Payments</h2>
          <ul className="divide-y divide-stone-800">
            {payments.map((payment) => (
              <li key={payment.id} className="flex justify-between py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-stone-400">Payment #{payment.id}</p>
                <p className="text-sm text-green-400">${payment.amount.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}