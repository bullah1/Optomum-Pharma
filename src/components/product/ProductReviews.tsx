import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
}

interface ProductReviewsProps {
  reviews: Review[];
}

const ProductReviews = ({ reviews }: ProductReviewsProps) => {
  if (!reviews.length) return null;

  return (
    <div className="bg-card px-4 py-4">
      <h3 className="text-sm font-bold text-foreground mb-3">Reviews ({reviews.length})</h3>
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
            <div className="flex items-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={11} className={s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"} />
              ))}
            </div>
            {review.comment && <p className="text-[13px] text-muted-foreground">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
