import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
  CornerDownRight,
  Info,
  Ruler,
  Clock,
  Package,
  ThumbsUp,
  Award
} from 'lucide-react';
import { getProduct, getProducts, getProductReviews, type Product, type ProductColor, pocketbase, Collections } from '@/lib/pocketbase';
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
import { ProductReviews } from '@/components/ProductReviews';
import { ProductDetails } from '@/components/ProductDetails';
import { Breadcrumbs, BreadcrumbItem } from '@/components/Breadcrumbs';
import { BuilderComponent } from "@/components/BuilderComponent";
import { builder } from "@/lib/builder";

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
  const [productDescription, setProductDescription] = useState<any>(null);
  
  const { addItem, items, getItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const { toast } = useToast();
  const relatedLoaded = useRef(false);
  const { user } = useAuth();
  
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  
  const [averageRating, setAverageRating] = useState(0);
  
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
    
    const loadProduct = async () => {
      console.log(`[PROD DEBUG] loadProduct called for id: ${id}`);
      if (!id) return;
      setLoading(true);
      setError('');
      
      try {
        console.log(`[PROD DEBUG] Calling getProduct with id: ${id}`);
        let data;
        
        try {
          // First try the main getProduct function
          data = await getProduct(id);
        } catch (mainError) {
          console.error(`[PROD DEBUG] Main getProduct failed:`, mainError);
          
          // If the main method fails, try a direct approach as fallback
          console.log(`[PROD DEBUG] Trying fallback direct product fetch for ${id}`);
          try {
            const record = await pocketbase.collection('products').getOne(id, {
              $autoCancel: false,
              requestKey: `prod_fallback_${id}_${Date.now()}`
            });
            
            // Transform to match our Product interface
            data = {
              ...record,
              $id: record.id,
              name: record.name || 'Unknown Product',
              description: record.description || '',
              price: record.price || 0,
              dimensions: record.dimensions || '',
              material: record.material || '',
              category: record.category || '',
              bestseller: record.bestseller || false,
              new: record.new || false,
              inStock: record.inStock || false,
              images: Array.isArray(record.images) 
                ? record.images.map((image: string) => `${record.id}/${image}`)
                : [],
              colors: typeof record.colors === 'string' ? JSON.parse(record.colors) : (record.colors || []),
              features: typeof record.features === 'string' ? JSON.parse(record.features) : (record.features || []),
              care: typeof record.care === 'string' ? JSON.parse(record.care) : (record.care || []),
              tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : (record.tags || []),
              specifications: record.specifications || {
                material: record.material || '',
                dimensions: record.dimensions || '',
                weight: '',
                capacity: '',
                style: '',
                pattern: '',
                closure: '',
                waterResistant: false
              },
              reviews: 0 // Default to 0 reviews
            } as Product;
            
            console.log(`[PROD DEBUG] Fallback product fetch successful for ${id}`);
          } catch (fallbackError) {
            console.error(`[PROD DEBUG] Fallback product fetch also failed:`, fallbackError);
            throw fallbackError; // Re-throw to be caught by the outer catch
          }
        }
        
        console.log(`[PROD DEBUG] Product loaded successfully:`, data.name);
        setProduct(data);
        
        if (data.images?.length > 0) {
          const mainImage = data.images[0];
          setSelectedImage(mainImage);
        }
        if (data.colors?.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        
        // Track product view with GTM
        trackProductView({
          item_id: data.id,
          item_name: data.name,
          price: Number(data.price) || 0,
          quantity: 1,
          item_category: data.category || 'Tote Bag',
          item_brand: 'Konipai',
          affiliation: 'Konipai Web Store'
        });
        
        // Load reviews to calculate average rating if product has reviews
        if (data.reviews && data.reviews > 0) {
          try {
            console.log(`[PROD DEBUG] Loading ${data.reviews} reviews for product ${id}`);
            const reviews = await getProductReviews(id);
            console.log(`[PROD DEBUG] Successfully loaded ${reviews.length} reviews`);
            
            const avgRating = reviews.length > 0
              ? reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / reviews.length
              : 0;
            setAverageRating(avgRating);
            console.log(`[PROD DEBUG] Set average rating to ${avgRating}`);
          } catch (reviewError) {
            console.error('[PROD DEBUG] Error loading reviews:', reviewError);
            // Continue with product display even if reviews fail to load
            setAverageRating(0);
          }
        }
        
        // After loading the product, try to load related products
        if (!relatedLoaded.current) {
          try {
            console.log(`[PROD DEBUG] Loading related products for ${data.category}`);
            const relatedData = await getProducts({ category: data.category });
            
            // Filter out the current product and limit to 4 products
            const filteredRelated = relatedData
              .filter(p => p.id !== id)
              .slice(0, 4);
              
            console.log(`[PROD DEBUG] Found ${filteredRelated.length} related products`);
            setRelatedProducts(filteredRelated);
            relatedLoaded.current = true;
          } catch (relatedError) {
            console.error('[PROD DEBUG] Error loading related products:', relatedError);
            // Continue even if related products fail to load
            setRelatedProducts([]);
          }
        }
      } catch (error) {
        console.error('[PROD DEBUG] Error loading product:', error);
        setError('Failed to load product. Please try refreshing the page.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
    
    // Start preloading images after main product is loaded
    return () => {
      relatedLoaded.current = false;
    };
  }, [id]);
  
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
  
  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Shop',
      href: '/shop',
    }
  ];
  
  // Add category if available
  if (product?.category) {
    breadcrumbItems.push({
      label: product.category.charAt(0).toUpperCase() + product.category.slice(1),
      href: `/shop?category=${product.category}`,
    });
  }
  
  // Current product is always last
  if (product?.name) {
    breadcrumbItems.push({
      label: product.name,
    });
  }
  
  return (
    <div className="pb-32">
      <div className="konipai-container py-8">
        {/* Breadcrumb */}
        <Breadcrumbs items={breadcrumbItems} isLoading={loading} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images - Enhanced Gallery */}
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
              {selectedImage ? (
                <>
                  <ProductImage
                    url={selectedImage}
                    alt={product?.name || 'Product image'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={true}
                    width={600}
                    height={600}
                    size="large"
                    aspectRatio="square"
                  />
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View size guide"
                  >
                    <Ruler className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="aspect-square w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {product?.images?.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(image)}
                  className={cn(
                    "relative bg-gray-100 rounded-lg overflow-hidden transition-all",
                    selectedImage === image ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary/50",
                    "aspect-square"
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
                    priority={index < 2}
                    aspectRatio="square"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Product Details - Enhanced */}
          <div>
            {/* Badges and Ratings */}
            <div className="flex items-center gap-4 mb-4">
              {product.bestseller && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Award className="w-3 h-3 mr-1" />
                  Bestseller
                </Badge>
              )}
              {product.new && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Package className="w-3 h-3 mr-1" />
                  New Arrival
                </Badge>
              )}
              {product.inStock ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  In Stock
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            {/* Title and Price */}
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-medium text-primary">
                  ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                </p>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <p className="text-lg text-gray-500 line-through">
                      ₹{product.original_price.toFixed(2)}
                    </p>
                    <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {product.reviews && product.reviews > 0 ? (
                  <div className="flex items-center gap-1 text-yellow-400">
                    {Array(5).fill(null).map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "h-4 w-4",
                          i < Math.round(averageRating) ? "fill-current" : ""
                        )} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-300">
                    {Array(5).fill(null).map((_, i) => (
                      <Star key={i} className="h-4 w-4" />
                    ))}
                  </div>
                )}
                <Link to="#reviews" className="text-sm text-muted-foreground hover:text-primary ml-2">
                  ({product.reviews || 0} reviews)
                </Link>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                <div className="text-xs">
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-muted-foreground">On orders over ₹999</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <div className="text-xs">
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-muted-foreground">100% secure checkout</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw className="h-6 w-6 text-primary" />
                <div className="text-xs">
                  <p className="font-medium">Easy Returns</p>
                  <p className="text-muted-foreground">30 day returns</p>
                </div>
              </div>
            </div>
            
            {/* Description Tabs */}
            <Tabs defaultValue="description" className="mb-6">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-4">
                <p className="text-muted-foreground">{product.description}</p>
              </TabsContent>
              <TabsContent value="features" className="pt-4">
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="shipping" className="pt-4">
                <div className="space-y-4 text-muted-foreground">
                  <p>• Free standard shipping on orders over ₹999</p>
                  <p>• Standard delivery: 3-5 business days</p>
                  <p>• Express delivery: 1-2 business days (additional charges apply)</p>
                  <p>• Easy 30-day returns policy</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Color</h3>
                  <span className="text-sm text-muted-foreground capitalize">
                    {selectedColor?.name || 'Select a color'}
                  </span>
                </div>
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
              </div>
            )}
            
            {/* Quantity Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Quantity</h3>
                {product.inStock && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    In Stock
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={decreaseQuantity}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                    title="Decrease quantity"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    title="Increase quantity"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {product.inStock && (
                  <span className="text-sm text-muted-foreground">
                    {product.stock > 10 ? 'More than 10 available' : `Only ${product.stock} left`}
                  </span>
                )}
              </div>
            </div>
            
            {/* Add to Cart and Actions */}
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
            
            {/* Social Proof */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span>{Math.floor(Math.random() * 50) + 20} people bought this in the last 24 hours</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Details - Moved above reviews */}
        {product && (
        <>
          <ProductDetails product={product} />
          
          {/* Builder.io editable product description section */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Product Description</h2>
            {productDescription ? (
              <BuilderComponent 
                model="product-description" 
                content={productDescription} 
              />
            ) : (
              <div className="prose max-w-none">
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </>
      )}
        
        {/* Reviews Section */}
        {id && (
          <ProductReviews 
            productId={id} 
            initialReviewCount={product.reviews} 
            onReviewAdded={async () => {
              console.log("[PROD DEBUG] Review added callback triggered");
              // Refresh product data to get updated review count
              if (id) {
                try {
                  const updatedProduct = await getProduct(id);
                  console.log(`[PROD DEBUG] Updated product fetched with ${updatedProduct.reviews} reviews`);
                  setProduct(updatedProduct);
                  
                  // Update average rating
                  const reviews = await getProductReviews(id);
                  console.log(`[PROD DEBUG] Fetched ${reviews.length} reviews for rating calculation`);
                  
                  if (reviews.length > 0) {
                    const total = reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0);
                    const avg = total / reviews.length;
                    console.log(`[PROD DEBUG] Calculated rating: ${avg} (total: ${total})`);
                    setAverageRating(avg);
                  } else {
                    console.log("[PROD DEBUG] No reviews to calculate average from");
                    setAverageRating(0);
                  }
                } catch (err) {
                  console.error("[PROD DEBUG] Error refreshing product after review:", err);
                }
              }
            }} 
          />
        )}
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16" id="related-products">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <Link 
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg mb-4">
                    <ProductImage
                      url={relatedProduct.images?.[0] || ''}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      width={300}
                      height={300}
                      size="medium"
                      priority={false}
                      aspectRatio="square"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {relatedProduct.bestseller && (
                        <Badge variant="default" className="bg-black text-white">
                          Bestseller
                        </Badge>
                      )}
                      {relatedProduct.new && (
                        <Badge variant="default" className="bg-primary text-white">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        ₹{typeof relatedProduct.price === 'number' ? relatedProduct.price.toFixed(2) : '0.00'}
                      </p>
                      {relatedProduct.colors?.length > 0 && (
                        <div className="flex -space-x-1">
                          {relatedProduct.colors.slice(0, 3).map((color) => (
                            <div 
                              key={color.value}
                              className="w-4 h-4 rounded-full border-2 border-white ring-1 ring-gray-200"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          {relatedProduct.colors.length > 3 && (
                            <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-medium">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-4 shadow-lg z-50">
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
