import { useState, useEffect, useCallback } from "react";
import { productsApi, type ProductsQuery } from "../api/products";
import type { Product } from "../types";

export function useProducts(initialQuery: ProductsQuery = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ProductsQuery>({ limit: 24, ...initialQuery });

  const fetch = useCallback(async (q: ProductsQuery) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.list(q);
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch(query);
  }, [fetch, query]);

  const updateQuery = useCallback(
    (updates: Partial<ProductsQuery>) =>
      setQuery((prev) => ({ ...prev, ...updates, offset: 0 })),
    [],
  );

  return { products, loading, error, query, updateQuery, refetch: () => fetch(query) };
}