import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BillingPortalPage } from "./pages/BillingPortalPage";
import { CheckoutReturnPage } from "./pages/CheckoutReturnPage";
import { EmbeddedCheckoutPage } from "./pages/EmbeddedCheckoutPage";
import { GuestCheckoutPage } from "./pages/GuestCheckoutPage";
import { ProductsPage } from "./pages/ProductsPage";
import { SubscriptionPlansPage } from "./pages/SubscriptionPlansPage";
import { CartProvider } from "./state/CartContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <ProductsPage /> },
      { path: "checkout", element: <GuestCheckoutPage /> },
      { path: "checkout/embedded", element: <EmbeddedCheckoutPage /> },
      { path: "checkout/return", element: <CheckoutReturnPage /> },
      { path: "plans", element: <SubscriptionPlansPage /> },
      { path: "portal", element: <BillingPortalPage /> }
    ]
  }
]);

export function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}
