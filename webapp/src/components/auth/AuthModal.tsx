import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signin, signup } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  const reset = () => {
    setName(""); setEmail(""); setPassword(""); setError(null);
  };

  const switchMode = (m: "signin" | "signup") => {
    setMode(m); reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signin(email, password);
      } else {
        await signup(name, email, password);
      }
      reset();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm bg-stone-900 border border-stone-700 rounded-sm shadow-2xl p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-500 hover:text-amber-100 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="mb-8">
            <h2 className="font-display text-2xl tracking-wide text-amber-100">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {mode === "signin"
                ? "Sign in to track orders and checkout faster."
                : "Create an account to get started."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 border border-stone-700 rounded-sm overflow-hidden">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-xs tracking-widest uppercase transition-colors ${
                  mode === m
                    ? "bg-amber-500 text-stone-950 font-semibold"
                    : "text-stone-400 hover:text-amber-100"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs tracking-widest uppercase text-stone-500 mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="text-xs tracking-widest uppercase text-stone-500 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-stone-500 mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-widest uppercase rounded-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-stone-600 text-center mt-5">
            Guest checkout is always available — no account required.
          </p>
        </div>
      </div>
    </>
  );
}