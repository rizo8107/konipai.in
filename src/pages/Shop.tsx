import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/product-service';
import { Product } from '@/types/product';
import { Filter, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const Shop = () => {
  const location = useLocation();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const products = await getProducts();
        const searchParams = new URLSearchParams(location.search);
        const category = searchParams.get('category');
        
        if (category) {
          setSelectedCategory(category);
          filterProducts(products, category, selectedSort);
        } else {
          setFilteredProducts(products);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [location.search]);
  
  const filterProducts = (products: Product[], category: string, sort: string) => {
    let result = [...products];
    
    // Filter by category
    if (category !== 'all') {
      result = result.filter(product => product.category === category);
    }
    
    // Sort products
    switch(sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Default sort - no change
        break;
    }
    
    setFilteredProducts(result);
  };
  
  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    try {
      const products = await getProducts();
      filterProducts(products, category, selectedSort);
    } catch (err) {
      setError('Failed to update category. Please try again.');
    }
  };
  
  const handleSortChange = async (sort: string) => {
    setSelectedSort(sort);
    try {
      const products = await getProducts();
      filterProducts(products, selectedCategory, sort);
    } catch (err) {
      setError('Failed to update sorting. Please try again.');
    }
  };
  
  if (error) {
    return (
      <div className="konipai-container py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="gap-2"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="konipai-container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Shop All Totes</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our collection of handcrafted tote bags, designed for style and sustainability.
            Each piece is made with care using premium materials.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{filteredProducts.length} products</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="totes">Totes</SelectItem>
                  <SelectItem value="crossbody">Crossbody</SelectItem>
                  <SelectItem value="backpack">Backpack</SelectItem>
                </SelectContent>
              </Select>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Select value={selectedSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </div>
  );
};

export default Shop;
