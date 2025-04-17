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
import { ProductImage } from '@/components/ProductImage';

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
        const orders = await pocketbase.collection('orders')
          .getList(1, 50, {
            filter: `user="${userId}"`,
            sort: '-created',
          });
        
        console.log('Orders found with user ID:', orders.items.length);
        
        if (orders.items.length > 0) {
          // Process orders to include parsed shipping address from text
          const processedOrders = orders.items.map(order => {
            // Parse shipping address from text if available
            if (order.shipping_address_text) {
              try {
                const parsedAddress = JSON.parse(order.shipping_address_text);
                order.expand = order.expand || {};
                order.expand.shippingAddress = parsedAddress;
              } catch (addressError) {
                console.error('Failed to parse shipping address for order:', order.id, addressError);
              }
            }
            return order;
          });
          
          setOrders(processedOrders as unknown as Order[]);
        } else {
          // If no orders found by user ID, try with email as fallback
          const allOrders = await pocketbase.collection('orders').getList(1, 50, {
            filter: `customer_email = "${userEmail}"`,
            sort: '-created',
          });
          
          console.log('Orders found with email:', allOrders.items.length);
          // Process orders to include parsed shipping address from text
          const processedOrders = allOrders.items.map(order => {
            // Parse shipping address from text if available
            if (order.shipping_address_text) {
              try {
                const parsedAddress = JSON.parse(order.shipping_address_text);
                order.expand = order.expand || {};
                order.expand.shippingAddress = parsedAddress;
              } catch (addressError) {
                console.error('Failed to parse shipping address for order:', order.id, addressError);
              }
            }
            return order;
          });
          
          // Filter client-side for this user's ID or email
          const userOrders = processedOrders.filter(order => 
            order.user === userId || order.customer_email === userEmail
          );
          
          console.log('Orders found with client-side filtering:', userOrders.length);
          setOrders(userOrders as unknown as Order[]);
        }
      } catch (apiErr) {
        console.error('Error with API call:', apiErr);
        
        // Last resort: fetch all orders and filter client-side
        try {
          const allOrders = await pocketbase.collection('orders').getList(1, 100, {
            sort: '-created',
          });
          
          // Process orders to include parsed shipping address from text
          const processedOrders = allOrders.items.map(order => {
            // Parse shipping address from text if available
            if (order.shipping_address_text) {
              try {
                const parsedAddress = JSON.parse(order.shipping_address_text);
                order.expand = order.expand || {};
                order.expand.shippingAddress = parsedAddress;
              } catch (addressError) {
                console.error('Failed to parse shipping address for order:', order.id, addressError);
              }
            }
            return order;
          });
          
          // Filter client-side for this user's ID or email
          const userOrders = processedOrders.filter(order => 
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
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchOrders}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (orders.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-4">Start shopping to create your first order</p>
            <Link to="/shop">
              <Button>
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to parse products
  const parseProducts = (products: Order['products']): OrderProduct[] => {
    if (typeof products === 'string') {
      try {
        return JSON.parse(products);
      } catch (e) {
        console.error('Error parsing products:', e);
        return [];
      }
    }
    return products as OrderProduct[];
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          const orderProducts = parseProducts(order.products);
          
          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Link to={`/orders/${order.id}`} className="hover:underline">
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(-8)}
                      </CardTitle>
                    </Link>
                    <CardDescription>
                      {(() => {
                        try {
                          const parsedCreatedDate = new Date(order.created);
                          if (isValid(parsedCreatedDate)) {
                            return format(parsedCreatedDate, 'PPP');
                          }
                          return format(new Date(), 'PPP'); // Use current date as fallback
                        } catch (err) {
                          console.error('Invalid date format:', order.created);
                          return 'Order Placed';
                        }
                      })()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)} className="ml-2">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </Badge>
                    {order.payment_status && (
                      <Badge variant="outline">
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Products */}
                  <div className="space-y-3">
                    {orderProducts.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                          {item.product?.images?.[0] ? (
                            <ProductImage
                              url={Array.isArray(item.product.images) 
                                ? item.product.images[0] 
                                : typeof item.product.images === 'string'
                                  ? item.product.images 
                                  : ''}
                              alt={item.product?.name || 'Product image'}
                              className="h-full w-full object-cover"
                              size="thumbnail"
                              aspectRatio="square"
                              priority={false}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <PackageOpen className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium">
                            {item.product?.name || 'Product Not Found'}
                          </h3>
                          <div className="text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            {item.color && (
                              <>
                                <span className="ml-2 text-gray-400">|</span>
                                <span className="ml-2">{item.color}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            ₹{(item.product?.price && item.quantity) 
                              ? (item.product.price * item.quantity).toFixed(2) 
                              : '0.00'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span>₹{(typeof order.subtotal === 'number') ? order.subtotal.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span>₹{(typeof order.shipping_cost === 'number') ? order.shipping_cost.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>₹{(typeof order.total === 'number') ? order.total.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.expand?.shippingAddress && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{order.expand.shippingAddress.street}</p>
                        <p>
                          {order.expand.shippingAddress.city}, {order.expand.shippingAddress.state} {order.expand.shippingAddress.postalCode}
                        </p>
                        <p>{order.expand.shippingAddress.country}</p>
                        {order.expand.shippingAddress.phone && (
                          <p className="mt-1">Phone: {order.expand.shippingAddress.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {order.payment_id && (
                    <span>Payment ID: {order.payment_id}</span>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/orders/${order.id}`}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
