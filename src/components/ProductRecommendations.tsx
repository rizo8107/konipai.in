import { useEffect, useState } from 'react';
import { Product } from '@/lib/pocketbase';
import ProductCard from './ProductCard';
import { ProductImage } from './ProductImage';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProductRecommendationsProps {
  currentProduct: Product;
  category?: string;
}

export function ProductRecommendations({ currentProduct, category }: ProductRecommendationsProps) {
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock similar products based on category
        const mockSimilar: Product[] = [
          {
            id: 'mock1',
            name: 'Similar Tote 1',
            price: 399,
            images: ['/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png'],
            category: category || 'totes'
          },
          {
            id: 'mock2',
            name: 'Similar Tote 2',
            price: 499,
            images: ['/product-images/create-a-mockup-of-black-tote-bag--aesthetic-backg.png'],
            category: category || 'totes'
          }
        ] as Product[];

        // Mock frequently bought together products
        const mockFrequent: Product[] = [
          {
            id: 'mock3',
            name: 'Matching Wallet',
            price: 199,
            images: ['/product-images/create-a-mockup-of-white-paper--textured-college-n.png'],
            category: 'accessories'
          },
          {
            id: 'mock4',
            name: 'Matching Purse',
            price: 299,
            images: ['/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back.png'],
            category: 'accessories'
          }
        ] as Product[];

        setSimilarProducts(mockSimilar);
        setFrequentlyBought(mockFrequent);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProduct.id, category]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">You May Also Like</h3>
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="similar" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="similar" className="flex-1">Similar Products</TabsTrigger>
          <TabsTrigger value="frequently" className="flex-1">Frequently Bought Together</TabsTrigger>
        </TabsList>
        
        <TabsContent value="similar" className="mt-6">
          <div className="grid grid-cols-4 gap-6">
            {similarProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="frequently" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              {frequentlyBought.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="font-medium">Buy the bundle and save 10%</p>
                <p className="text-sm text-muted-foreground">Total: ₹{calculateBundlePrice()}</p>
              </div>
              <Button>Add Bundle to Cart</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recently Viewed */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recently Viewed</h3>
        <div className="grid grid-cols-6 gap-4">
          {mockRecentlyViewed.map((product) => (
            <div key={product.id} className="aspect-square relative rounded-lg overflow-hidden group">
              <ProductImage
                url={product.images?.[0] || ''}
                alt={product.name}
                className="w-full h-full"
                aspectRatio="square"
                size="thumbnail"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button variant="secondary" size="sm">View</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate bundle price
function calculateBundlePrice() {
  // TODO: Implement actual bundle price calculation
  return '1,999.00';
}

// Mock recently viewed products
const mockRecentlyViewed: Product[] = [
  {
    id: 'recent1',
    name: 'Classic Tote',
    price: 399,
    images: ['/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png'],
    category: 'totes'
  },
  {
    id: 'recent2',
    name: 'Modern Backpack',
    price: 599,
    images: ['/product-images/create-a-mockup-of-black-tote-bag--aesthetic-backg.png'],
    category: 'backpacks'
  }
] as Product[]; 