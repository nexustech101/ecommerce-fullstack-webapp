import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAccount } from "../state/AccountContext";

type AuthMode = "signin" | "signup";

export function AuthPage() {
  const navigate = useNavigate();
  const { customer, signIn, signOut, signUp } = useAccount();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await signIn({ email: email.trim(), password });
      }
      navigate("/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update account");
    } finally {
      setLoading(false);
    }
  }

  if (customer) {
    return (
      <section className="form-page">
        <div>
          <p className="eyebrow">Signed in</p>
          <h1>Your shop profile is ready.</h1>
          <p className="muted">Checkout can now use your local customer profile instead of guest details.</p>
        </div>
        <div className="panel account-card">
          <div>
            <span className="account-avatar">{customer.name.slice(0, 1).toUpperCase()}</span>
          </div>
          <div>
            <h2>{customer.name}</h2>
            <p className="muted">{customer.email}</p>
            <div className="button-row">
              <Link className="primary-button" to="/checkout">Go to checkout</Link>
              <button className="secondary-button" onClick={signOut}>Sign out</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="form-page auth-page">
      <div>
        <p className="eyebrow">Optional account</p>
        <h1>Sign in for faster checkout, or keep shopping as a guest.</h1>
        <p className="muted">Accounts are optional; Stripe still handles card details securely during checkout.</p>
      </div>

      <form className="panel form-card" onSubmit={handleSubmit}>
        <div className="segmented-control" role="tablist" aria-label="Account mode">
          <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        {mode === "signup" ? (
          <label>
            Name
            <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
        ) : null}
        <label>
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input
            required
            minLength={mode === "signup" ? 8 : 1}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary-button" disabled={loading}>
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <Link className="text-link" to="/checkout">Continue as guest instead</Link>
      </form>
    </section>
  );
}
