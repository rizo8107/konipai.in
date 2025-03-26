import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw, 
  Star,
  Check,
  ImageIcon,
  Loader2,
  ShoppingCart,
  CornerDownRight
} from 'lucide-react';
import { getProduct, getProducts, type Product, type ProductColor, pocketbase, Collections } from '@/lib/pocketbase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from '@/components/ProductImage';
import { preloadImages, getPocketBaseImageUrl, ImageSize } from '@/utils/imageOptimizer';
import { trackEcommerceEvent } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { 
  trackProductView, 
  trackAddToCart, 
  trackButtonClick 
} from '@/lib/analytics';

// Generate a very low-res placeholder
const generatePlaceholder = (color = '#f3f4f6') => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='${color.replace('#', '%23')}'/%3E%3C/svg%3E`;
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const { toast } = useToast();
  const relatedLoaded = useRef(false);
  const { user } = useAuth();
  
  // Check if the current product is already in cart
  const isInCart = useMemo(() => {
    return items.some(item => 
      item.productId === id && 
      (!selectedColor || item.color === selectedColor?.name)
    );
  }, [items, id, selectedColor]);
  
  // Force scroll to top when page loads or product ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  // Preload images for better performance
  useEffect(() => {
    if (product && product.images && product.images.length > 0 && !imagesPreloaded) {
      // Create a function to preload all product images
      const preloadProductImages = async () => {
        try {
          // Immediately show thumbnail quality for all images
          product.images.forEach(image => {
            const img = new Image();
            img.src = getPocketBaseImageUrl(image, Collections.PRODUCTS, "thumbnail", "webp");
            img.loading = 'eager'; // Load thumbnails immediately
          });

          // Preload main image at medium quality immediately
          if (product.images[0]) {
            const mainImage = product.images[0];
            const mediumQualityLink = document.createElement('link');
            mediumQualityLink.rel = 'preload';
            mediumQualityLink.as = 'image';
            mediumQualityLink.href = getPocketBaseImageUrl(mainImage, Collections.PRODUCTS, "medium", "webp");
            mediumQualityLink.type = 'image/webp';
            mediumQualityLink.setAttribute('fetchpriority', 'high');
            document.head.appendChild(mediumQualityLink);

            // Then load high quality version slightly delayed
            setTimeout(() => {
              const highQualityLink = document.createElement('link');
              highQualityLink.rel = 'preload';
              highQualityLink.as = 'image';
              highQualityLink.href = getPocketBaseImageUrl(mainImage, Collections.PRODUCTS, "large", "webp");
              highQualityLink.type = 'image/webp';
              document.head.appendChild(highQualityLink);
            }, 1000);
          }

          // Load medium quality versions of other images when idle
          if (product.images.length > 1) {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                product.images.slice(1).forEach(image => {
                  const img = new Image();
                  img.src = getPocketBaseImageUrl(image, Collections.PRODUCTS, "medium", "webp");
                  img.loading = 'lazy';
                });
              });
            } else {
              // Fallback for browsers that don't support requestIdleCallback
              setTimeout(() => {
                product.images.slice(1).forEach(image => {
                  const img = new Image();
                  img.src = getPocketBaseImageUrl(image, Collections.PRODUCTS, "medium", "webp");
                  img.loading = 'lazy';
                });
              }, 2000);
            }
          }

          setImagesPreloaded(true);
        } catch (error) {
          console.error('Error preloading images:', error);
        }
      };

      preloadProductImages();
    }
  }, [product, imagesPreloaded]);
  
  // Optimize related products image loading
  useEffect(() => {
    if (relatedProducts.length > 0 && !relatedLoaded.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !relatedLoaded.current) {
              // First load thumbnails immediately
              relatedProducts.forEach(product => {
                if (product.images?.[0]) {
                  const img = new Image();
                  img.src = getPocketBaseImageUrl(product.images[0], Collections.PRODUCTS, "thumbnail", "webp");
                  img.loading = 'lazy';
                }
              });

              // Then load better quality when idle
              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                  relatedProducts.forEach(product => {
                    if (product.images?.[0]) {
                      const img = new Image();
                      img.src = getPocketBaseImageUrl(product.images[0], Collections.PRODUCTS, "medium", "webp");
                      img.loading = 'lazy';
                    }
                  });
                });
              }

              relatedLoaded.current = true;
              observer.disconnect();
            }
          });
        },
        { rootMargin: '500px' }
      );

      const relatedSection = document.querySelector('#related-products');
      if (relatedSection) {
        observer.observe(relatedSection);
      }

      return () => observer.disconnect();
    }
  }, [relatedProducts]);
  
  useEffect(() => {
    document.title = product?.name ? `${product.name} | Konipai` : 'Product | Konipai';
    
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const productData = await getProduct(id);
        if (!productData) {
          setError('Product not found');
          return;
        }

        setProduct(productData);
        if (productData.images?.length > 0) {
          const mainImage = productData.images[0];
          setSelectedImage(mainImage);
        }
        if (productData.colors?.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
        
        // Track product view with GTM
        trackProductView({
          item_id: productData.id,
          item_name: productData.name,
          price: Number(productData.price) || 0,
          quantity: 1,
          item_category: productData.category || 'Tote Bag',
          item_brand: 'Konipai',
          affiliation: 'Konipai Web Store'
        });
        
        // Fetch related products
        const allProducts = await getProducts({ category: productData.category });
        const related = allProducts
          .filter(p => p.id !== id)
          .slice(0, 4);
        setRelatedProducts(related);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product details. Please try again later.",
        });
        navigate("/shop");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
    
    // Reset preload state when product ID changes
    setImagesPreloaded(false);
    relatedLoaded.current = false;
    
  }, [id, navigate, toast]);
  
  // Optimize image selection handling
  const handleImageSelect = (image: string) => {
    // First set the thumbnail version immediately
    setSelectedImage(image);
    
    // Then preload and switch to higher quality versions
    const preloadHighRes = () => {
      // First load medium quality
      const mediumQualityLink = document.createElement('link');
      mediumQualityLink.rel = 'preload';
      mediumQualityLink.as = 'image';
      mediumQualityLink.href = getPocketBaseImageUrl(image, Collections.PRODUCTS, "medium", "webp");
      mediumQualityLink.type = 'image/webp';
      document.head.appendChild(mediumQualityLink);

      // Then load high quality slightly delayed
      setTimeout(() => {
        const highQualityLink = document.createElement('link');
        highQualityLink.rel = 'preload';
        highQualityLink.as = 'image';
        highQualityLink.href = getPocketBaseImageUrl(image, Collections.PRODUCTS, "large", "webp");
        highQualityLink.type = 'image/webp';
        document.head.appendChild(highQualityLink);
      }, 500);
    };
    
    preloadHighRes();
  };
  
  if (loading) {
    return (
      <div className="konipai-container py-8">
        <div className="animate-pulse space-y-8">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="konipai-container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-8 text-muted-foreground">{error || "Sorry, we couldn't find the product you're looking for."}</p>
        <Button asChild variant="outline">
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }
  
  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    
    // Add to cart logic
    addItem(
      product, 
      quantity, 
      selectedColor?.name || ''
    );
    
    // Track add to cart with enhanced properties
    trackAddToCart({
      item_id: product.id,
      item_name: product.name,
      price: Number(product.price) || 0,
      quantity: quantity,
      item_variant: selectedColor?.name,
      item_category: product.category || 'Tote Bag',
      item_brand: 'Konipai',
      affiliation: 'Konipai Web Store'
    });
    
    // Track button click
    trackButtonClick('add_to_cart_button', 'Add to Cart', window.location.pathname);
    
    toast({
      title: "Added to cart",
      description: `${quantity} ${product.name} added to your cart`,
    });
  };

  const toggleWishlist = async () => {
    // Track wishlist button click
    trackButtonClick(
      isWishlisted ? 'remove_from_wishlist_button' : 'add_to_wishlist_button', 
      isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist',
      window.location.pathname
    );
    
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Please Login",
          description: "You need to login to add items to your wishlist.",
        });
        return;
      }

      setIsWishlisted(!isWishlisted);

      if (!isWishlisted) {
        // Add to wishlist
        await pocketbase.collection('wishlist').create({
          user: user.id,
          product: product.id,
        });
        toast({
          title: "Added to Wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      } else {
        // Remove from wishlist
        const record = await pocketbase.collection('wishlist').getFirstListItem(
          `user="${user.id}" && product="${product.id}"`
        );
        await pocketbase.collection('wishlist').delete(record.id);
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      setIsWishlisted(!isWishlisted); // Revert the state change
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your wishlist. Please try again.",
      });
    }
  };

  const handleShare = async () => {
    try {
      // Track share button click
      trackButtonClick('share_button', 'Share', window.location.pathname);
      
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} at Konipai!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "The product link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="konipai-container py-8">
        <Link 
          to="/shop" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              {selectedImage ? (
                <ProductImage
                  url={selectedImage}
                  alt={product?.name || 'Product image'}
                  className="w-full h-full object-cover"
                  priority={true}
                  width={600}
                  height={600}
                  size="large"
                  aspectRatio="square"
                />
              ) : (
                <div className="aspect-square w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {product?.images?.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(image)}
                  className={cn(
                    "relative bg-gray-100 rounded-lg overflow-hidden transition-all",
                    selectedImage === image ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary/50",
                    "aspect-square" // Ensure consistent aspect ratio
                  )}
                  aria-label={`View ${product.name} image ${index + 1}`}
                >
                  <ProductImage
                    url={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    width={150}
                    height={150}
                    size="thumbnail"
                    priority={index < 2} // Only prioritize first two thumbnails
                    aspectRatio="square"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Product Details */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              {product.bestseller && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  Bestseller
                </Badge>
              )}
              {product.new && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  New Arrival
                </Badge>
              )}
              <div className="flex items-center gap-1 text-yellow-400">
                {Array(5).fill(null).map((_, i) => (
                  <Star key={i} className="fill-current h-4 w-4" />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  ({product.reviews || 0} reviews)
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-medium mb-6 text-primary">
              ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
            </p>
            
            <div className="mb-6">
              <p className="text-muted-foreground">{product.description}</p>
            </div>
            
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "group relative w-12 h-12 rounded-full transition-all",
                        selectedColor?.value === color.value
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-border hover:ring-2 hover:ring-primary/50"
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor?.value === color.value && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm mt-2 text-muted-foreground capitalize">
                  {selectedColor?.name}
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex border rounded-lg">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={decreaseQuantity}
                    className="rounded-l-lg"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-16 flex items-center justify-center border-x">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={increaseQuantity}
                    className="rounded-r-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              
              {isInCart && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
                  asChild
                >
                  <Link to="/checkout">
                    <CornerDownRight className="mr-2 h-5 w-5" />
                    Proceed to Checkout
                  </Link>
                </Button>
              )}
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleWishlist}
                  className={cn(
                    "flex-1",
                    isWishlisted && "text-pink-600 fill-pink-600"
                  )}
                >
                  <Heart className={cn(
                    "h-5 w-5",
                    isWishlisted && "fill-current"
                  )} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Product Details</h3>
              <div className="overflow-x-auto pb-2">
                <Tabs defaultValue="features">
                  <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 konipai-tabs-list">
                    <TabsTrigger value="features" className="konipai-tab">Features</TabsTrigger>
                    <TabsTrigger value="dimensions" className="konipai-tab">Dimensions</TabsTrigger>
                    <TabsTrigger value="care" className="konipai-tab">Care</TabsTrigger>
                    <TabsTrigger value="routine" className="konipai-tab">How to Use</TabsTrigger>
                    <TabsTrigger value="tips" className="konipai-tab">Tips & Advice</TabsTrigger>
                  </TabsList>
                  <TabsContent value="features" className="pt-4">
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="dimensions" className="pt-4">
                    <div className="space-y-4 text-muted-foreground">
                      <p><strong>Dimensions:</strong> {product.dimensions}</p>
                      <p><strong>Material:</strong> {product.material}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="care" className="pt-4">
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {product.care.map((care, index) => (
                        <li key={index}>{care}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="routine" className="pt-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Daily Routine</h3>
                        <p className="text-muted-foreground">
                          Keep your tote bag clean and organized. Empty it regularly and store it in a cool, dry place when not in use.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">For Best Results</h3>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                          <li>Clean spills immediately</li>
                          <li>Avoid overloading</li>
                          <li>Rotate usage to maintain shape</li>
                          <li>Store properly when not in use</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="tips" className="pt-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Expert's Tips</h3>
                        <p className="text-muted-foreground">
                          Our tote bags are designed for versatility and durability. The canvas material will soften and develop character over time, making each bag unique to its owner.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Pro Tips</h3>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                          <li>Use internal organizers for better organization</li>
                          <li>Apply water repellent spray for added protection</li>
                          <li>Clean the bottom regularly</li>
                          <li>Use bag hooks when placing on floors</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="my-16" />
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-16" id="related-products">
            <h2 className="text-3xl font-light text-center mb-8 md:mb-12">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {relatedProducts.map((relatedProduct, index) => (
                <Link 
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg mb-2 md:mb-4">
                    <ProductImage
                      url={relatedProduct.images?.[0] || ''}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                      width={300}
                      height={300}
                      size="medium"
                      priority={false}
                      aspectRatio="square"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!relatedProduct.colors || !Array.isArray(relatedProduct.colors) || relatedProduct.colors.length === 0) {
                            addItem(relatedProduct, 1, '');
                          } else {
                            addItem(relatedProduct, 1, relatedProduct.colors[0].value);
                          }
                          toast({
                            title: "Added to cart",
                            description: `${relatedProduct.name} added to your cart.`,
                          });
                        }}
                        variant="default"
                        size="sm"
                        className={cn(
                          "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100",
                          "transition-all duration-200 bg-white text-black hover:bg-gray-100",
                          "hidden sm:flex" // Hide on very small screens
                        )}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                    
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {relatedProduct.bestseller && (
                        <Badge variant="default" className="bg-black text-white text-xs">
                          Bestseller
                        </Badge>
                      )}
                      {relatedProduct.new && (
                        <Badge variant="default" className="bg-primary text-white text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm sm:text-base mb-1 truncate group-hover:text-primary transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm sm:text-base font-medium">
                        ₹{typeof relatedProduct.price === 'number' ? relatedProduct.price.toFixed(2) : '0.00'}
                      </p>
                      {relatedProduct.colors?.length > 0 && (
                        <div className="flex -space-x-1">
                          {relatedProduct.colors.slice(0, 3).map((color) => (
                            <div 
                              key={color.value}
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ring-1 ring-gray-200"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          {relatedProduct.colors.length > 3 && (
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] sm:text-[10px] font-medium">
                              +{relatedProduct.colors.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Add to Cart Button */}
      <div className="fixed bottom-0 left-0 w-full bg-background border-t border-gray-100 shadow-lg transform transition-transform duration-300 z-50 py-3 px-4 md:py-4">
        <div className="konipai-container">
          <div className="flex gap-2">
            {isInCart ? (
              <>
                <Button 
                  className="flex-1" 
                  onClick={handleAddToCart}
                  size="lg"
                  variant="outline"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add Again
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  asChild
                  size="lg"
                >
                  <Link to="/checkout">
                    <CornerDownRight className="h-4 w-4 mr-2" /> Checkout
                  </Link>
                </Button>
              </>
            ) : (
              <Button 
                className="w-full"
                onClick={handleAddToCart}
                size="lg"
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> 
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
