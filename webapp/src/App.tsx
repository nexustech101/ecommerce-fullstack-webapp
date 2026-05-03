import { useState, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CheckoutReturnPage } from "./pages/CheckoutReturnPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { PayPalReturnPage } from "./pages/PayPalReturnPage";

type NavState = {
  page: string;
  params?: Record<string, unknown>;
};

function resolveInitialPage(): NavState {
  // Handle /checkout/return?session_id=... as the return URL
  if (
    window.location.pathname.includes("/checkout/return") ||
    window.location.pathname.includes("/billing/success")
  ) {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) return { page: "checkout-return", params: { sessionId } };
  }
  if (window.location.pathname.includes("/checkout/paypal/return")) {
    const params = new URLSearchParams(window.location.search);
    const paypalOrderId = params.get("token");
    if (paypalOrderId) return { page: "paypal-return", params: { paypalOrderId } };
  }
  if (window.location.pathname.includes("/checkout/paypal/cancel")) {
    return { page: "checkout" };
  }
  return { page: "home" };
}

export default function App() {
  const [nav, setNav] = useState<NavState>(resolveInitialPage);

  const handleNavigate = useCallback((page: string, params?: Record<string, unknown>) => {
    setNav({ page, params });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const renderPage = () => {
    switch (nav.page) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "product":
        return (
          <ProductDetailPage
            productId={nav.params?.id as number}
            onNavigate={handleNavigate}
          />
        );
      case "checkout":
        return <CheckoutPage onNavigate={handleNavigate} />;
      case "checkout-return":
        return (
          <CheckoutReturnPage
            sessionId={nav.params?.sessionId as string}
            onNavigate={handleNavigate}
          />
        );
      case "paypal-return":
        return (
          <PayPalReturnPage
            paypalOrderId={nav.params?.paypalOrderId as string}
            onNavigate={handleNavigate}
          />
        );
      case "subscriptions":
        return <SubscriptionsPage onNavigate={handleNavigate} />;
      case "orders":
        return <OrdersPage onNavigate={handleNavigate} />;
      case "order-detail":
        return (
          <OrderDetailPage
            orderId={nav.params?.orderId as number}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        <Layout onNavigate={handleNavigate}>{renderPage()}</Layout>
      </CartProvider>
    </AuthProvider>
  );
}
