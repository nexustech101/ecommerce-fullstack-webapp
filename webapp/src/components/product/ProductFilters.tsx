import { useState, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ProductsQuery } from "../../api/products";

type ProductFiltersProps = {
  query: ProductsQuery;
  onUpdate: (updates: Partial<ProductsQuery>) => void;
};

export function ProductFilters({ query, onUpdate }: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(query.min_price?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(query.max_price?.toString() ?? "");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onUpdate({ search: val || undefined });
    }, 350);
  };

  const applyPrice = () => {
    onUpdate({
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  const clearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    if (searchRef.current) searchRef.current.value = "";
    onUpdate({ search: undefined, min_price: undefined, max_price: undefined });
  };

  const hasFilters = query.search || query.min_price !== undefined || query.max_price !== undefined;

  return (
    <div className="space-y-4 mb-10">
      <div className="flex gap-3 items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            ref={searchRef}
            type="text"
            defaultValue={query.search ?? ""}
            placeholder="Search products…"
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2.5 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-sm text-sm transition-colors ${
            showFilters
              ? "bg-amber-500 border-amber-500 text-stone-950"
              : "bg-stone-900 border-stone-700 text-stone-300 hover:border-stone-500"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-stone-500 hover:text-amber-100 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Price filter panel */}
      {showFilters && (
        <div className="bg-stone-900 border border-stone-700 rounded-sm p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 mb-1.5 block">
              Min Price
            </label>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-28 px-3 py-2 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 mb-1.5 block">
              Max Price
            </label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="w-28 px-3 py-2 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            onClick={applyPrice}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}