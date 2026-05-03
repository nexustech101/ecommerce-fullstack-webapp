import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "../cart/CartDrawer";

type LayoutProps = {
  children: ReactNode;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function Layout({ children, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <Header onNavigate={onNavigate} />
      <main className="pt-16">{children}</main>
      <Footer />
      <CartDrawer onNavigate={onNavigate} />
    </div>
  );
}