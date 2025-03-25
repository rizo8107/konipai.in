import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { pocketbase } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, PackageOpen, AlertCircle, ArrowRight, Clock, Check, AlertTriangle, Package, MapPin, Phone, Mail } from 'lucide-react';

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
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_id?: string;
  payment_order_id?: string;
  created: string;
  updated: string;
  coupon_code?: string;
  discount_amount?: number;
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

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Define fetchOrderDetails with useCallback to avoid dependency cycle
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    if (!user) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    try {
      // Get the user's email for security check
      const userEmail = pocketbase.authStore.model?.email;
      
      // Fetch the order details
      const orderData = await pocketbase.collection('orders').getOne(orderId, {
        expand: 'shippingAddress',
      });

      // Security check: only allow users to view their own orders
      if (orderData.customer_email !== userEmail) {
        console.error('Unauthorized: This order does not belong to the current user');
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setOrder(orderData as unknown as Order);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [orderId, user]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Render loading state
  if (loading) {
    return (
      <div className="container py-10">
        <div className="mb-4">
          <Skeleton className="h-8 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Order</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-4">
              <Button onClick={fetchOrderDetails}>Try Again</Button>
              <Button variant="outline" asChild>
                <Link to="/orders">Back to Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render no order found state
  if (!order) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button asChild>
              <Link to="/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Safely parse dates with validation
  let orderDate = new Date();
  let updatedDate = new Date();
  
  try {
    const parsedCreatedDate = new Date(order.created);
    if (isValid(parsedCreatedDate)) {
      orderDate = parsedCreatedDate;
    }
  } catch (err) {
    console.error('Invalid created date format:', order.created);
  }
  
  try {
    const parsedUpdatedDate = new Date(order.updated);
    if (isValid(parsedUpdatedDate)) {
      updatedDate = parsedUpdatedDate;
    }
  } catch (err) {
    console.error('Invalid updated date format:', order.updated);
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
              <CardDescription>
                Placed on {format(orderDate, 'PPP')} at {format(orderDate, 'p')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="font-medium mb-3">Items</h3>
                  <div className="space-y-4">
                    {products.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {/* Product Image - Direct from Backend */}
                          <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                            {item.product?.images && item.product.images[0] ? (
                              <img 
                                src={`${import.meta.env.VITE_POCKETBASE_URL.replace(/\/$/, '')}/api/files/pbc_4092854851/${item.product.id}/${item.product.images[0].split('/').pop()}`} 
                                alt={item.product.name || 'Product'} 
                                className="w-full h-full object-cover"
                                loading="eager"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.error('Image load error:', e);
                                  e.currentTarget.src = '/placeholder-product.svg';
                                }}
                              />
                            ) : (
                              // Placeholder for products without images
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity} {item.color && `• ${item.color}`}
                            </div>
                            <div className="text-sm">₹{item.product.price.toFixed(2)} each</div>
                          </div>
                        </div>
                        <div className="font-medium">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Totals */}
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{(order.subtotal ? parseFloat(order.subtotal.toString()) : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>₹{(order.shipping_cost ? parseFloat(order.shipping_cost.toString()) : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>₹{(order.total ? parseFloat(order.total.toString()) : 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {order.payment_id && (
                  <div>
                    <h3 className="font-medium mb-2">Payment Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment ID</span>
                        <span>{order.payment_id}</span>
                      </div>
                      {order.payment_order_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Razorpay Order ID</span>
                          <span>{order.payment_order_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status</span>
                        <span>{order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer & Shipping Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Contact Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{order.customer_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{order.customer_phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {order.expand?.shippingAddress ? (
                        <>
                          <p>{order.expand.shippingAddress.street}</p>
                          <p>
                            {order.expand.shippingAddress.city}, {order.expand.shippingAddress.state} {order.expand.shippingAddress.postalCode}
                          </p>
                          <p>{order.expand.shippingAddress.country}</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Address details not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/30 flex justify-between">
              <Button variant="outline" size="sm" asChild>
                <Link to="/orders">Back to Orders</Link>
              </Button>
              {order.status === 'delivered' && (
                <Button size="sm" variant="default">
                  Download Invoice
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
