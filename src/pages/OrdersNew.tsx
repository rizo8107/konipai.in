import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { pocketbase } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingBag, 
  PackageOpen, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Check, 
  AlertTriangle, 
  Package, 
  MapPin, 
  Calendar,
  CreditCard,
  ChevronRight,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar as CalendarIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Add image optimization utility with format fallback
const getOptimizedImageUrl = (collectionId: string, recordId: string, filename: string) => {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL.replace(/\/$/, '');
  // Try to detect image format from filename
  const format = filename.split('.').pop()?.toLowerCase() || '';
  const supportedFormats = ['webp', 'jpg', 'jpeg', 'png'];
  
  // If format is supported, use it; otherwise default to original
  const useFormat = supportedFormats.includes(format) ? format : 'original';
  
  return `${baseUrl}/api/files/${collectionId}/${recordId}/${filename}${useFormat === 'original' ? '' : `?thumb=100x100&format=${useFormat}&quality=80`}`;
};

// Add placeholder image constant
const PLACEHOLDER_IMAGE = '/placeholder.svg';

// Define interface for order product
interface OrderProduct {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  color?: string;
}

// Define interface for order
interface Order {
  id: string;
  user: string;
  products: string | OrderProduct[];
  subtotal: number;
  total: number;
  shipping_cost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string; // ID of the shipping address
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  payment_order_id?: string;
  created: string;
  updated: string;
  expand?: {
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone?: string;
    }
  }
}

// Badge colors for different order statuses
const getStatusBadgeVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'shipped':
      return 'outline';
    case 'delivered':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    case 'shipped':
      return <Package className="h-4 w-4 text-purple-500" />;
    case 'delivered':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusLabel = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'Order Placed';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

const getPaymentStatusBadge = (status: Order['payment_status']) => {
  switch (status) {
    case 'paid':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>;
    case 'refunded':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Order card component for better organization
const OrderCard = ({ order }: { order: Order }) => {
  // Parse products from JSON string if needed
  const products = Array.isArray(order.products) 
    ? order.products 
    : (typeof order.products === 'string' && order.products.trim() !== '') 
      ? JSON.parse(order.products) 
      : [];
  
  // Format date for display
  const orderDate = isValid(new Date(order.created))
    ? format(new Date(order.created), 'MMM d, yyyy')
    : 'Unknown date';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      {/* Order header with ID and status */}
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Order #{order.id.substring(0, 8)}</h3>
              {getStatusIcon(order.status)}
              <Badge variant={getStatusBadgeVariant(order.status)} className="ml-2">
                {getStatusLabel(order.status)}
              </Badge>
              {getPaymentStatusBadge(order.payment_status)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
              <Calendar className="h-3 w-3" />
              <span>{orderDate}</span>
            </div>
          </div>
          <Button asChild variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Link to={`/orders/${order.id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      {/* Order items */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Show first 2 products, summarize the rest */}
          {products.slice(0, 2).map((item: OrderProduct, index: number) => (
            <div key={index} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={getOptimizedImageUrl('pbc_4092854851', item.product.id, item.product.images[0].split('/').pop() || '')}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      width={48}
                      height={48}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const originalSrc = target.src;
                        
                        if (originalSrc.includes('?thumb=')) {
                          const baseUrl = originalSrc.split('?')[0];
                          target.src = baseUrl;
                        } else {
                          target.src = PLACEHOLDER_IMAGE;
                          target.onerror = null;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{item.product.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Qty: {item.quantity}</span>
                    {item.color && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                        <span className="capitalize">{item.color}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="font-medium text-sm">
                {formatCurrency(item.product.price * item.quantity)}
              </div>
            </div>
          ))}
          
          {products.length > 2 && (
            <div className="text-xs text-muted-foreground pt-1 pl-14">
              +{products.length - 2} more {products.length - 2 === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
      </CardContent>

      {/* Order footer with total and shipping address */}
      <CardFooter className="bg-muted/20 p-4 flex flex-col gap-2">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {order.payment_id && (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="truncate max-w-[140px]">{order.payment_id}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
          </div>
        </div>
        
        {order.expand?.shippingAddress && (
          <div className="w-full flex items-start gap-1 mt-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground truncate">
              {order.expand.shippingAddress.street}, {order.expand.shippingAddress.city}, {order.expand.shippingAddress.state} {order.expand.shippingAddress.postalCode}
            </div>
          </div>
        )}
        
        <Button asChild variant="default" size="sm" className="w-full mt-2">
          <Link to={`/orders/${order.id}`}>View Order Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Loading skeleton for orders
const OrderSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="bg-muted/30 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="p-4">
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
    <CardFooter className="bg-muted/20 p-4 flex flex-col gap-2">
      <div className="w-full flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-full mt-1" />
      <Skeleton className="h-9 w-full mt-2" />
    </CardFooter>
  </Card>
);

// Empty state component
const EmptyOrdersState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="bg-muted/30 p-4 rounded-full mb-4">
      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">No orders yet</h3>
    <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
      When you place an order, it will appear here. Start shopping to see your orders!
    </p>
    <Button asChild>
      <Link to="/shop">Browse Products</Link>
    </Button>
  </div>
);

// Error state component
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="bg-red-100 p-4 rounded-full mb-4">
      <AlertCircle className="h-8 w-8 text-red-500" />
    </div>
    <h3 className="text-lg font-medium mb-2">Couldn't load orders</h3>
    <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
      We encountered an error while trying to load your orders. Please try again.
    </p>
    <Button onClick={onRetry}>Try Again</Button>
  </div>
);

// Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show a limited number of page buttons
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    
    if (currentPage <= 3) {
      return [...pages.slice(0, 5), null, totalPages];
    } else if (currentPage >= totalPages - 2) {
      return [1, null, ...pages.slice(totalPages - 5)];
    } else {
      return [1, null, currentPage - 1, currentPage, currentPage + 1, null, totalPages];
    }
  };
  
  const visiblePages = getVisiblePages();
  
  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {visiblePages.map((page, i) => 
        page === null ? (
          <span key={`ellipsis-${i}`} className="px-2">...</span>
        ) : (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page as number)}
            className="w-8 h-8 p-0"
          >
            {page}
          </Button>
        )
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function OrdersNew() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('-created');
  
  // Filter orders based on search term and active tab
  const filteredOrders = orders.filter(order => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) || 
      order.customer_name.toLowerCase().includes(searchLower) ||
      (order.payment_id && order.payment_id.toLowerCase().includes(searchLower));
    
    // Tab filter
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'processing') return order.status === 'processing' && matchesSearch;
    if (activeTab === 'shipped') return order.status === 'shipped' && matchesSearch;
    if (activeTab === 'delivered') return order.status === 'delivered' && matchesSearch;
    if (activeTab === 'cancelled') return order.status === 'cancelled' && matchesSearch;
    
    return matchesSearch;
  });

  // Function to load orders
  const loadOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('Please log in to view your orders');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check for authenticated user
      if (!pocketbase.authStore.model?.id) {
        setLoading(false);
        setError('User authentication required');
        return;
      }
      
      // Get user ID and email
      const userId = pocketbase.authStore.model.id;
      const userEmail = pocketbase.authStore.model.email;
      console.log('OrdersNew - Fetching for user:', userId, userEmail);
      
      try {
        // First try to get orders directly by user ID
        const userOrders = await pocketbase.collection('orders').getList(currentPage, itemsPerPage, {
          filter: `user = "${userId}"`,
          sort: sortField,
          expand: 'shippingAddress'
        });
        
        console.log('Orders found with user ID:', userOrders.items.length);
        setOrders(userOrders.items as unknown as Order[]);
        setTotalItems(userOrders.totalItems);
        setTotalPages(userOrders.totalPages);
        
        // If no orders found by user ID, try by email
        if (userOrders.items.length === 0 && userEmail) {
          console.log('No orders found by ID, trying email:', userEmail);
          const emailOrders = await pocketbase.collection('orders').getList(currentPage, itemsPerPage, {
            filter: `customer_email = "${userEmail}"`,
            sort: sortField,
            expand: 'shippingAddress'
          });
          
          console.log('Orders found with email:', emailOrders.items.length);
          setOrders(emailOrders.items as unknown as Order[]);
          setTotalItems(emailOrders.totalItems);
          setTotalPages(emailOrders.totalPages);
        }
      } catch (fetchError) {
        console.error('Error fetching orders:', fetchError);
        setError('Failed to fetch orders. Please try again.');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, sortField]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortField(value);
    setCurrentPage(1); // Reset to first page when sorting changes
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Load orders on mount and when dependencies change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and track all your orders
          </p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-9 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowDownAZ className="h-4 w-4" />
                Sort
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => handleSortChange('-created')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Newest first</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('created')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Oldest first</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('-total')}>
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                <span>Price: High to Low</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('total')}>
                <ArrowUpAZ className="mr-2 h-4 w-4" />
                <span>Price: Low to High</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={loadOrders} />
      ) : filteredOrders.length === 0 ? (
        searchTerm ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders found matching "{searchTerm}"</p>
            <Button variant="link" onClick={() => setSearchTerm('')}>Clear search</Button>
          </div>
        ) : (
          <EmptyOrdersState />
        )
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} orders
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          )}
        </>
      )}
    </div>
  );
}
