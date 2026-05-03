import { useState } from "react";
import { ShoppingBag, User, Menu, X, LogOut } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../auth/AuthModal";

type HeaderProps = {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function Header({ onNavigate }: HeaderProps) {
  const { totalItems, openCart } = useCart();
  const { customer, signout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => onNavigate("home")}
              className="font-display text-xl tracking-[0.2em] text-amber-100 uppercase hover:text-amber-300 transition-colors"
            >
              Maison
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => onNavigate("home")}
                className="text-sm tracking-widest uppercase text-stone-400 hover:text-amber-100 transition-colors"
              >
                Shop
              </button>
              <button
                onClick={() => onNavigate("subscriptions")}
                className="text-sm tracking-widest uppercase text-stone-400 hover:text-amber-100 transition-colors"
              >
                Subscribe
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* User */}
              <div className="relative">
                {customer ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-stone-400 hover:text-amber-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-800 flex items-center justify-center text-xs text-amber-100 font-medium">
                      {customer.name[0].toUpperCase()}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="text-stone-400 hover:text-amber-100 transition-colors"
                    aria-label="Sign in"
                  >
                    <User size={20} />
                  </button>
                )}
                {userMenuOpen && customer && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-10 z-50 w-52 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-1">
                      <div className="px-4 py-2 border-b border-stone-700">
                        <p className="text-xs text-stone-400 truncate">{customer.email}</p>
                        <p className="text-sm text-amber-100 font-medium truncate">{customer.name}</p>
                      </div>
                      <button
                        onClick={() => { onNavigate("orders"); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:text-amber-100 hover:bg-stone-800 transition-colors"
                      >
                        My Orders
                      </button>
                      <button
                        onClick={() => { signout(); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:text-amber-100 hover:bg-stone-800 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative text-stone-400 hover:text-amber-100 transition-colors"
                aria-label={`Cart (${totalItems})`}
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-stone-400 hover:text-amber-100 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden bg-stone-950 border-t border-stone-800 py-4 px-6 flex flex-col gap-4">
            <button
              onClick={() => { onNavigate("home"); setMobileOpen(false); }}
              className="text-sm tracking-widest uppercase text-stone-300 hover:text-amber-100 text-left"
            >
              Shop
            </button>
            <button
              onClick={() => { onNavigate("subscriptions"); setMobileOpen(false); }}
              className="text-sm tracking-widest uppercase text-stone-300 hover:text-amber-100 text-left"
            >
              Subscribe
            </button>
            {!customer && (
              <button
                onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                className="text-sm tracking-widest uppercase text-stone-300 hover:text-amber-100 text-left"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}