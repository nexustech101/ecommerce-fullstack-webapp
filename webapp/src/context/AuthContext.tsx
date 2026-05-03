import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Customer } from "../types";
import { authApi } from "../api/auth";

type AuthContextValue = {
  customer: Customer | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ec_customer";

function loadCustomer(): Customer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(loadCustomer);

  const persist = (c: Customer | null) => {
    setCustomer(c);
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const signin = useCallback(async (email: string, password: string) => {
    const { customer } = await authApi.signin({ email, password });
    persist(customer);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { customer } = await authApi.signup({ name, email, password });
    persist(customer);
  }, []);

  const signout = useCallback(() => persist(null), []);

  return (
    <AuthContext.Provider value={{ customer, signin, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}