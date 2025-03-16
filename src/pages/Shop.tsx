import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, type Product } from '@/lib/pocketbase';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Heart, Star, ImageIcon, Loader2, ShoppingBag, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { ProductImage } from '@/components/ProductImage';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<"name" | "price" | "bestseller">('name');
  const [category, setCategory] = useState<string>('all');
  const { addItem } = useCart();
  const { toast } = useToast();
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts(undefined, controller.signal);
        setProducts(data);
      } catch (error) {
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          console.error('Error fetching products:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load products. Please try again later.',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, [toast]);

  const categories = ['all', ...new Set(products.map((product) => product.category).filter(Boolean))];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'bestseller':
          return Number(b.bestseller) - Number(a.bestseller);
        default:
          return 0;
      }
    });

  const handleAddToCart = (product: Product) => {
    if (!product.colors || !Array.isArray(product.colors) || product.colors.length === 0) {
      addItem(product, 1, '');
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
      return;
    }
    
    addItem(product, 1, product.colors[0].value);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlistedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[300px] bg-gray-100 animate-pulse" />
        <div className="konipai-container py-10">
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="w-full max-w-sm">
                <div className="h-10 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-[150px] bg-muted rounded-md animate-pulse" />
                <div className="h-10 w-[100px] bg-muted rounded-md animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[300px] bg-gray-900 flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-[url('/images/shop-hero.jpg')] bg-cover bg-center opacity-50" />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Collection</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Discover our handcrafted tote bags, designed for style and sustainability
          </p>
        </div>
      </div>

      <div className="konipai-container py-10">
        <div className="space-y-8">
          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={sortBy} onValueChange={(value: 'name' | 'price' | 'bestseller') => setSortBy(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="bestseller">Bestseller</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <Separator className="my-4" />
                  <ScrollArea className="h-[calc(100vh-8rem)]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 text-sm font-medium">Categories</h4>
                        <div className="space-y-2">
                          {categories.map((cat) => (
                            <Button
                              key={cat}
                              variant={category === cat ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setCategory(cat)}
                            >
                              {cat === 'all' ? 'All Categories' : cat}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-300 rounded-lg mb-4 group">
                    {product.images?.[0] ? (
                      <ProductImage 
                        url={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {product.bestseller && (
                        <Badge variant="secondary" className="bg-black text-white rounded-full">
                          Bestseller
                        </Badge>
                      )}
                      {product.new && (
                        <Badge variant="secondary" className="bg-primary/90 text-white rounded-full">
                          New
                        </Badge>
                      )}
                    </div>

                    {/* Add to Cart button at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        variant="ghost"
                        className="w-full bg-transparent hover:bg-transparent text-black flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-base mb-1">
                      {product.name}
                    </h3>
                    <p className="text-base font-medium">
                      ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
