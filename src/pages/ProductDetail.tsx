import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Heart, Share2, Truck, Shield, RotateCcw, Star } from 'lucide-react';
import { getProductById, getProducts } from '@/lib/product-service';
import ProductGrid from '@/components/ProductGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from '@/context/CartContext';
import { Product, ProductColor } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const productData = await getProductById(id);
        if (productData) {
          setProduct(productData);
          setSelectedImage(productData.images[0]);
          setSelectedColor(productData.colors[0] || null);
          
          // Fetch related products
          const allProducts = await getProducts();
          const related = allProducts
            .filter(p => p.$id !== id && p.category === productData.category)
            .slice(0, 4);
          setRelatedProducts(related);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  if (loading) {
    return (
      <div className="konipai-container py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 w-24 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 w-3/4 mb-4 rounded"></div>
              <div className="h-6 bg-gray-200 w-1/4 mb-6 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
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
        <p className="mb-8">{error || "Sorry, we couldn't find the product you're looking for."}</p>
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
    if (selectedColor) {
      addToCart({
        id: product.$id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        color: selectedColor.value
      });
      toast.success('Added to cart successfully!');
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      });
    } catch (err) {
      toast.error('Failed to share product');
    }
  };
  
  return (
    <div className="konipai-container py-8">
      <Link to="/shop" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to Shop
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(image)}
                className={cn(
                  "aspect-square bg-gray-50 rounded-lg overflow-hidden",
                  selectedImage === image && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover object-center"
                />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-4 mb-4">
            {product.bestseller && (
              <Badge variant="secondary" className="bg-black text-white">
                Bestseller
              </Badge>
            )}
            {product.new && (
              <Badge variant="secondary" className="bg-primary text-white">
                New Arrival
              </Badge>
            )}
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="fill-current h-4 w-4" />
              <Star className="fill-current h-4 w-4" />
              <Star className="fill-current h-4 w-4" />
              <Star className="fill-current h-4 w-4" />
              <Star className="fill-current h-4 w-4" />
              <span className="text-sm text-gray-600 ml-2">(24 reviews)</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-medium mb-6">${product.price.toFixed(2)}</p>
          
          <div className="mb-6">
            <p className="text-gray-600">{product.description}</p>
          </div>
          
          {product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Color</h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-12 h-12 rounded-full transition-all",
                      selectedColor?.value === color.value
                        ? "ring-2 ring-primary ring-offset-2"
                        : "ring-1 ring-gray-200"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-sm mt-2 text-gray-600 capitalize">{selectedColor?.name}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Quantity</h3>
            <div className="flex items-center gap-4">
              <div className="flex border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  className="px-4 py-2 hover:bg-gray-50 rounded-l-lg"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="px-6 py-2 border-x border-gray-200 flex items-center justify-center min-w-[3rem]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={increaseQuantity}
                  className="px-4 py-2 hover:bg-gray-50 rounded-r-lg"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 mb-8">
            <Button
              onClick={handleAddToCart}
              disabled={!selectedColor || !product.inStock}
              className="flex-1 gap-2"
              size="lg"
            >
              <ShoppingBag size={18} />
              Add to Cart
            </Button>
            <Button
              onClick={toggleWishlist}
              variant="outline"
              size="lg"
              className={cn(
                isWishlisted && "bg-pink-50 border-pink-200 text-pink-600"
              )}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn(
                "h-5 w-5",
                isWishlisted && "fill-current"
              )} />
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              aria-label="Share product"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <Truck className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Free Shipping</p>
                <p className="text-sm text-gray-600">On orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <Shield className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">2 Year Warranty</p>
                <p className="text-sm text-gray-600">100% guarantee</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <RotateCcw className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Free Returns</p>
                <p className="text-sm text-gray-600">Within 30 days</p>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="w-full grid grid-cols-5 bg-gray-50">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
              <TabsTrigger value="care">Care</TabsTrigger>
              <TabsTrigger value="routine">How to Use</TabsTrigger>
              <TabsTrigger value="tips">Tips & Advice</TabsTrigger>
            </TabsList>
            <TabsContent value="features" className="pt-4">
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="dimensions" className="pt-4">
              <div className="space-y-4 text-gray-600">
                <p><strong>Dimensions:</strong> {product.dimensions}</p>
                <p><strong>Material:</strong> {product.material}</p>
              </div>
            </TabsContent>
            <TabsContent value="care" className="pt-4">
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {product.care.map((care, index) => (
                  <li key={index}>{care}</li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="routine" className="pt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Daily Routine</h3>
                  <p className="text-gray-600">Apply to the face, neck and décolleté in the morning and evening after cleansing. Gently massage in an upward lifting motion moving up and out. Tap excess into the skin with your fingertips.</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">For Best Results</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Use morning and evening as part of your skincare routine</li>
                    <li>Apply to clean, dry skin</li>
                    <li>Follow with sunscreen during daytime use</li>
                    <li>Can be used under makeup as a primer</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="tips" className="pt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Expert's Tips</h3>
                  <p className="text-gray-600">On top of everything else you have to do in the morning, moisturising might feel like a chore. However, the skin on our face and neck is perhaps the most exposed and sensitive to environmental stressors and so requires round the clock care. Whether you have dry, oily or combination skin, maintaining a healthy moisture balance not only helps prevent common problems like acne, but also helps your skin to look younger, fight wrinkles and blemishes and protects against damage.</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Pro Tips</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Like a cashmere blanket for your face, this cream provides 24-hour protection</li>
                    <li>Use as a protective layer at night to help skin recover from daily exposure</li>
                    <li>Can be used as an effective primer base to keep makeup in place</li>
                    <li>For extra hydration, apply to slightly damp skin</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Customer Reviews</h2>
              <Button variant="outline">Write a Review</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100"></div>
                  <div>
                    <p className="font-medium">Sarah M.</p>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">This product is amazing! The texture is light but moisturizing, and it absorbs quickly without leaving any greasy residue. My skin feels hydrated all day long.</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100"></div>
                  <div>
                    <p className="font-medium">Emily R.</p>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                      <Star className="fill-current h-4 w-4" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">I've been using this for a month now and can really see the difference. My makeup applies better and lasts longer. Will definitely repurchase!</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">See All Reviews</Button>
            </div>
          </div>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <>
          <div className="mt-16 mb-16">
            <h2 className="text-3xl font-light text-center mb-12">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <Link 
                  key={relatedProduct.$id}
                  to={`/product/${relatedProduct.$id}`}
                  className="group block"
                >
                  <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {relatedProduct.new && (
                        <Badge variant="secondary" className="bg-white text-black">
                          NEW IN
                        </Badge>
                      )}
                      {relatedProduct.bestseller && (
                        <Badge variant="secondary" className="bg-white text-black">
                          BEST SELLER
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist();
                      }}
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 hover:bg-white/50"
                      aria-label="Add to wishlist"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 uppercase tracking-wide mb-1">
                      {relatedProduct.category}
                    </div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className="h-4 w-4 fill-current text-yellow-400" 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {relatedProduct.reviews || 42} REVIEWS
                      </span>
                    </div>
                    <p className="font-medium">£{relatedProduct.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              <Link to="/product/safou-sorbet" className="group block">
                <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src="/products/safou-sorbet.jpg" 
                    alt="Safou Sorbet Cleansing Balm"
                    className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                  />
                  <Badge variant="secondary" className="absolute top-3 left-3 bg-white text-black">
                    NEW IN
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                    FACE • CLEANSING • BALM
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    Safou Sorbet Cleansing Balm
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-current text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">21 REVIEWS</span>
                  </div>
                  <p className="font-medium">£63</p>
                </div>
              </Link>

              <Link to="/product/feeling-myself" className="group block">
                <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src="/products/feeling-myself.jpg" 
                    alt="Feeling Myself Lip Balm"
                    className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                  />
                  <Badge variant="secondary" className="absolute top-3 left-3 bg-white text-black">
                    BEST SELLER
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                    LIPS • COMFORTING • BALM
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    Feeling Myself Lip Balm
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-current text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">82 REVIEWS</span>
                  </div>
                  <p className="font-medium">£39</p>
                </div>
              </Link>

              <Link to="/product/gold-drip" className="group block">
                <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src="/products/gold-drip.jpg" 
                    alt="Gold Drip Nourishing Body & Hair Oil"
                    className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge variant="secondary" className="bg-white text-black">
                      BEST SELLER
                    </Badge>
                    <Badge variant="secondary" className="bg-white text-black">
                      AWARD WINNER
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <img 
                      src="/badges/vogue.png" 
                      alt="As seen in Vogue"
                      className="w-12 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                    BODY & HAIR • NOURISHING • OIL
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    Gold Drip Nourishing Body & Hair Oil
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-current text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">42 REVIEWS</span>
                  </div>
                  <p className="font-medium">£55</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
