import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Customer, SignInRequest, SignUpRequest } from "../api/types";

const STORAGE_KEY = "northstar_customer";

type AccountContextValue = {
  customer: Customer | null;
  signIn: (payload: SignInRequest) => Promise<Customer>;
  signUp: (payload: SignUpRequest) => Promise<Customer>;
  signOut: () => void;
};

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

function readStoredCustomer(): Customer | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Customer;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => readStoredCustomer());

  function storeCustomer(nextCustomer: Customer) {
    setCustomer(nextCustomer);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustomer));
  }

  const value = useMemo<AccountContextValue>(
    () => ({
      customer,
      signIn: async (payload) => {
        const response = await api.signIn(payload);
        storeCustomer(response.customer);
        return response.customer;
      },
      signUp: async (payload) => {
        const response = await api.signUp(payload);
        storeCustomer(response.customer);
        return response.customer;
      },
      signOut: () => {
        setCustomer(null);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }),
    [customer]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used inside AccountProvider");
  }
  return context;
}
