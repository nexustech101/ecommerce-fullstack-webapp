import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BillingPortalPage } from "./pages/BillingPortalPage";
import { CheckoutReturnPage } from "./pages/CheckoutReturnPage";
import { EmbeddedCheckoutPage } from "./pages/EmbeddedCheckoutPage";
import { GuestCheckoutPage } from "./pages/GuestCheckoutPage";
import { ProductsPage } from "./pages/ProductsPage";
import { SubscriptionPlansPage } from "./pages/SubscriptionPlansPage";
import { AuthPage } from "./pages/AuthPage";
import { RouteErrorPage } from "./pages/RouteErrorPage";
import { AccountProvider } from "./state/AccountContext";
import { CartProvider } from "./state/CartContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <ProductsPage /> },
      { path: "checkout", element: <GuestCheckoutPage /> },
      { path: "checkout/embedded", element: <EmbeddedCheckoutPage /> },
      { path: "checkout/return", element: <CheckoutReturnPage /> },
      { path: "billing/success", element: <CheckoutReturnPage /> },
      { path: "settings/billing", element: <BillingPortalPage /> },
      { path: "plans", element: <SubscriptionPlansPage /> },
      { path: "portal", element: <BillingPortalPage /> },
      { path: "account", element: <AuthPage /> },
      { path: "*", element: <RouteErrorPage /> }
    ]
  }
]);

export function App() {
  return (
    <AccountProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AccountProvider>
  );
}
