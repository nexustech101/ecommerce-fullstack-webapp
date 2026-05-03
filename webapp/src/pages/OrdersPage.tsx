import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Package, ArrowRight } from "lucide-react";
import { ordersApi } from "../api/orders";
import type { Order } from "../types";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

type OrdersPageProps = {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function OrdersPage({ onNavigate }: OrdersPageProps) {
  const { customer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) { setLoading(false); return; }
    ordersApi
      .list({ customer_id: customer.id, limit: 50 })
      .then(setOrders)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load orders."))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">Sign in to view your orders.</p>
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl text-amber-100 mb-10">My Orders</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-amber-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-400 text-sm py-8">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={36} className="text-stone-700 mx-auto mb-4" />
          <p className="text-stone-500 text-sm">No orders yet.</p>
          <button
            onClick={() => onNavigate("home")}
            className="mt-4 text-xs text-amber-500 tracking-widest uppercase hover:text-amber-300"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              onClick={() => onNavigate("order-detail", { orderId: order.id })}
              className="bg-stone-900 border border-stone-700 hover:border-amber-800 rounded-sm p-5 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-stone-200 mb-1">Order #{order.id}</p>
                <p className="text-xs text-stone-500">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-amber-100">
                  ${order.total_amount.toFixed(2)}
                </span>
                <ArrowRight
                  size={16}
                  className="text-stone-600 group-hover:text-amber-400 transition-colors"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}