import { Link, NavLink, Outlet } from "react-router-dom";
import { useAccount } from "../state/AccountContext";
import { useCart } from "../state/CartContext";

export function Layout() {
  const { itemCount } = useCart();
  const { customer } = useAccount();

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
          <NavLink to="/account">{customer ? customer.name.split(" ")[0] : "Sign in"}</NavLink>
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
