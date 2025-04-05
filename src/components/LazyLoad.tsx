import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Simple loading indicator
const LoadingIndicator = () => (
  <div className="flex justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

// Lazy loaded ProductReviews component
const LazyProductReviewsComponent = lazy(() => 
  import('@/components/ProductReviews').then(module => ({
    default: module.ProductReviews
  }))
);

export function LazyProductReviews(props: {
  productId: string;
  initialReviewCount?: number;
  onReviewAdded?: () => Promise<void>;
}) {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <LazyProductReviewsComponent {...props} />
    </Suspense>
  );
}

// Define product interface structure
interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    images?: string[];
    specifications?: Record<string, string | boolean>;
    features?: string[];
    care?: string[];
    [key: string]: unknown;
  };
}

// Lazy loaded ProductDetails component
const LazyProductDetailsComponent = lazy(() => 
  import('@/components/ProductDetails').then(module => ({
    default: module.ProductDetails
  }))
);

export function LazyProductDetails(props: ProductDetailsProps) {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <LazyProductDetailsComponent {...props} />
    </Suspense>
  );
} 