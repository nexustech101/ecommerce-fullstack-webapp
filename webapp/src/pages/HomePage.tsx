import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/product/ProductCard";
import { ProductFilters } from "../components/product/ProductFilters";
import { Loader2, AlertCircle, Package } from "lucide-react";

type HomePageProps = {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  const { products, loading, error, query, updateQuery } = useProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero section */}
      <div className="mb-16 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-amber-500 mb-4">New Collection</p>
        <h1 className="font-display text-5xl md:text-7xl text-amber-100 leading-none tracking-tight mb-6">
          Objects of <br />
          <em>Distinction</em>
        </h1>
        <p className="text-stone-400 max-w-md mx-auto text-sm leading-relaxed">
          Thoughtfully sourced goods that reward daily use. Nothing superfluous, everything essential.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-6 mb-10">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-xs tracking-[0.3em] uppercase text-stone-600">All Products</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      {/* Filters */}
      <ProductFilters query={query} onUpdate={updateQuery} />

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="text-amber-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertCircle size={32} className="text-red-500 mb-4" />
          <p className="text-stone-400 text-sm">{error}</p>
          <button
            onClick={() => updateQuery({})}
            className="mt-4 text-xs text-amber-500 hover:text-amber-300 tracking-widest uppercase"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Package size={32} className="text-stone-700 mb-4" />
          <p className="text-stone-500 text-sm">No products found.</p>
          <button
            onClick={() => updateQuery({ search: undefined, min_price: undefined, max_price: undefined })}
            className="mt-4 text-xs text-amber-500 hover:text-amber-300 tracking-widest uppercase"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
