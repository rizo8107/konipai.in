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
import { ShoppingBag, PackageOpen, AlertCircle, ArrowRight, Clock, Check, AlertTriangle, Package, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Add image optimization utility
const getOptimizedImageUrl = (collectionId: string, recordId: string, filename: string) => {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL.replace(/\/$/, '');
  return `${baseUrl}/api/files/${collectionId}/${recordId}/${filename}?thumb=100x100&quality=80`;
};

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
      return <Clock className="h-4 w-4 text-blue-500" />;
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

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchOrders with useCallback to avoid dependency cycle
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('Please log in to view your orders');
      return;
    }

    setLoading(true);
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
      console.log('Orders - Fetching for user:', userId, userEmail);
      
      try {
        // First try to get orders directly by user ID
        const userOrders = await pocketbase.collection('orders').getList(1, 50, {
          filter: `user = "${userId}"`,
          sort: '-created',
          expand: 'shippingAddress'
        });
        
        console.log('Orders found with user ID:', userOrders.items.length);
        
        if (userOrders.items.length > 0) {
          setOrders(userOrders.items as unknown as Order[]);
        } else {
          // If no orders found by user ID, try with email as fallback
          const allOrders = await pocketbase.collection('orders').getList(1, 50, {
            filter: `customer_email = "${userEmail}"`,
            sort: '-created',
            expand: 'shippingAddress'
          });
          
          console.log('Orders found with email:', allOrders.items.length);
          setOrders(allOrders.items as unknown as Order[]);
        }
      } catch (apiErr) {
        console.error('Error with API call:', apiErr);
        
        // Last resort: fetch all orders and filter client-side
        try {
          const allOrders = await pocketbase.collection('orders').getList(1, 100, {
            sort: '-created',
            expand: 'shippingAddress'
          });
          
          // Filter client-side for this user's ID or email
          const userOrders = allOrders.items.filter(order => 
            order.user === userId || order.customer_email === userEmail
          );
          
          console.log('Orders found with client-side filtering:', userOrders.length);
          setOrders(userOrders as unknown as Order[]);
        } catch (fallbackErr) {
          console.error('Fallback query failed:', fallbackErr);
          setOrders([]);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load your orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]); // Only re-create when user changes

  useEffect(() => {
    // Fetch orders when component mounts
    fetchOrders();
  }, [fetchOrders]); // fetchOrders is stable thanks to useCallback

  // Render loading state
  if (loading) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchOrders}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render empty state
  if (orders.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Button asChild>
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render orders
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          // Parse products data
          let products: OrderProduct[] = [];
          try {
            if (typeof order.products === 'string') {
              products = JSON.parse(order.products);
            } else {
              products = order.products as OrderProduct[];
            }
          } catch (err) {
            products = [];
          }

          // Safely parse the date with validation
          let orderDate = new Date();
          try {
            const parsedDate = new Date(order.created);
            if (isValid(parsedDate)) {
              orderDate = parsedDate;
            }
          } catch (err) {
            console.error('Invalid date format:', order.created);
            // Keep default current date if parsing fails
          }
          
          return (
            <Card key={order.id}>
              <CardHeader className="bg-muted/50 py-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Order #{order.id}
                      {order.payment_id && (
                        <span className="text-xs text-muted-foreground">
                          Payment: {order.payment_id}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(orderDate, 'PPP')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </Badge>
                    <Badge variant="outline">
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="space-y-2">
                  {products.slice(0, 2).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {/* Optimized Product Image */}
                        <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                          {item.product?.images && item.product.images[0] ? (
                            <img 
                              src={getOptimizedImageUrl('pbc_4092854851', item.product.id, item.product.images[0].split('/').pop() || '')}
                              alt={item.product.name || 'Product'} 
                              className="w-full h-full object-cover"
                              loading="lazy"
                              width={40}
                              height={40}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('Image load error:', e);
                                e.currentTarget.src = '/placeholder-product.svg';
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
                          <div className="text-xs text-muted-foreground">
                            Qty: {item.quantity} {item.color && `• ${item.color}`}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                  {products.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{products.length - 2} more items
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {order.payment_id && (
                    <p>Payment ID: {order.payment_id}</p>
                  )}
                </div>
                
                {/* Shipping Address */}
                {order.expand?.shippingAddress && (
                  <div className="mt-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        {order.expand.shippingAddress.street}, {order.expand.shippingAddress.city}, {order.expand.shippingAddress.state} {order.expand.shippingAddress.postalCode}
                      </div>
                    </div>
                  </div>
                )}
                
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-sm">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-2">
                <Button asChild variant="secondary" size="sm" className="ml-auto">
                  <Link to={`/orders/${order.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
