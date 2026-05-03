import { useEffect, useState } from "react";
import { ArrowLeft, ImageOff, Loader2, Star, ShoppingBag, AlertCircle } from "lucide-react";
import { productsApi } from "../api/products";
import type { Product, Review } from "../types";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

type ProductDetailPageProps = {
  productId: number;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
};

function StarRating({ rating, interactive = false, onChange }: {
  rating: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          fill={(hovered || rating) >= s ? "#f59e0b" : "transparent"}
          className={`${(hovered || rating) >= s ? "text-amber-400" : "text-stone-600"} ${interactive ? "cursor-pointer transition-colors" : ""}`}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(s)}
        />
      ))}
    </div>
  );
}

export function ProductDetailPage({ productId, onNavigate }: ProductDetailPageProps) {
  const { addToCart } = useCart();
  const { customer } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([productsApi.get(productId), productsApi.getReviews(productId)])
      .then(([p, r]) => { setProduct(p); setReviews(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle size={32} className="text-red-500 mb-4" />
        <p className="text-stone-400">Product not found.</p>
        <button onClick={() => onNavigate("home")} className="mt-4 text-xs text-amber-500 tracking-widest uppercase">
          Back to Shop
        </button>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || rating === 0) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const newReview = await productsApi.createReview({
        product_id: productId,
        customer_id: customer.id,
        rating,
        comment,
      });
      setReviews((r) => [newReview, ...r]);
      setRating(0); setComment(""); setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back */}
      <button
        onClick={() => onNavigate("home")}
        className="flex items-center gap-2 text-stone-500 hover:text-amber-100 text-sm transition-colors mb-10"
      >
        <ArrowLeft size={16} />
        Back to Shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
        {/* Image */}
        <div className="aspect-square bg-stone-900 rounded-sm overflow-hidden">
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={48} className="text-stone-700" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-xs text-stone-500">({reviews.length})</span>
            </div>
          )}
          <h1 className="font-display text-4xl text-amber-100 leading-tight mb-4">
            {product.name}
          </h1>
          <p className="text-2xl text-stone-200 mb-6">${product.price.toFixed(2)}</p>
          <p className="text-stone-400 text-sm leading-relaxed mb-8">{product.description}</p>

          {outOfStock ? (
            <div className="py-3.5 border border-stone-700 text-center text-sm text-stone-500 tracking-widest uppercase rounded-sm">
              Sold Out
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-500 tracking-widest uppercase">Qty</span>
                <div className="flex items-center border border-stone-700 rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-stone-400 hover:text-amber-100 transition-colors"
                  >–</button>
                  <span className="px-4 py-2 text-sm text-stone-200 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 text-stone-400 hover:text-amber-100 transition-colors"
                  >+</button>
                </div>
                {product.stock <= 5 && (
                  <span className="text-xs text-amber-600">Only {product.stock} left</span>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm tracking-widest uppercase rounded-sm transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                {added ? "Added to Cart!" : "Add to Cart"}
              </button>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-stone-800 space-y-2 text-xs text-stone-600">
            <p className="tracking-wide">Free shipping on orders over $75.</p>
            <p className="tracking-wide">30-day hassle-free returns.</p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-stone-800 pt-12">
        <h2 className="font-display text-2xl text-amber-100 mb-8">Reviews</h2>

        {/* Write review */}
        {customer ? (
          <form onSubmit={handleReviewSubmit} className="bg-stone-900 border border-stone-700 rounded-sm p-6 mb-10">
            <h3 className="text-sm font-medium text-stone-200 mb-4">Write a Review</h3>
            <div className="mb-4">
              <p className="text-xs text-stone-500 mb-2">Your Rating</p>
              <StarRating rating={rating} interactive onChange={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience…"
              className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-sm text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-500 transition-colors resize-none mb-4"
            />
            {reviewError && (
              <p className="text-xs text-red-400 mb-3">{reviewError}</p>
            )}
            {reviewSuccess && (
              <p className="text-xs text-green-400 mb-3">Review submitted!</p>
            )}
            <button
              type="submit"
              disabled={reviewLoading || rating === 0}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-widest uppercase rounded-sm transition-colors disabled:opacity-50"
            >
              {reviewLoading ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-stone-500 mb-8">
            <button onClick={() => {}} className="text-amber-500 hover:text-amber-300">Sign in</button> to leave a review.
          </p>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-stone-600 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-stone-800 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <StarRating rating={review.rating} />
                  <time className="text-xs text-stone-600">
                    {new Date(review.created_at).toLocaleDateString()}
                  </time>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}