import { Link, NavLink, Outlet } from "react-router-dom";
import { useCart } from "../state/CartContext";

export function Layout() {
  const { itemCount } = useCart();

  return (
    <div className="shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark">N</span>
          <span>
            <strong>Northstar Goods</strong>
            <small>Curated commerce checkout</small>
          </span>
        </Link>
        <nav>
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/plans">Plans</NavLink>
          <NavLink to="/portal">Billing Portal</NavLink>
        </nav>
        <Link className="cart-pill" to="/checkout">
          Cart <strong>{itemCount}</strong>
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
