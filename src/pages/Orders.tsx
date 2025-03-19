import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pocketbase } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Clock, Check, AlertTriangle, Package, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

// Define types for orders
interface OrderItem {
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

interface Order {
  id: string;
  created: string;
  user: string;
  products: string | OrderItem[];
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
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        setError('Please log in to view your orders');
        return;
      }

      try {
        const ordersList = await pocketbase.collection('orders').getList(1, 100, {
          filter: `user="${user.id}"`,
          sort: '-created',
        });
        setOrders(ordersList.items as unknown as Order[]);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load your orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

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

  const getPaymentStatusIcon = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusLabel = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Payment Pending';
      case 'failed':
        return 'Payment Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
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

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">No Orders Yet</h1>
        <p className="text-muted-foreground mb-8">You haven't placed any orders yet.</p>
        <Button asChild>
          <Link to="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          // Parse products data
          let products: OrderItem[] = [];
          try {
            if (typeof order.products === 'string') {
              products = JSON.parse(order.products);
            } else {
              products = order.products as OrderItem[];
            }
          } catch (err) {
            products = [];
          }

          const orderDate = new Date(order.created);
          
          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Order #{order.id}
                    </CardTitle>
                    <CardDescription>
                      Placed on {format(orderDate, 'PPP')} at {format(orderDate, 'p')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </Badge>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      <span className="flex items-center gap-1">
                        {getPaymentStatusIcon(order.payment_status)}
                        {getPaymentStatusLabel(order.payment_status)}
                      </span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Items</h3>
                    <div className="space-y-2">
                      {products.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {item.product.images && item.product.images[0] && (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name} 
                                className="w-10 h-10 object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image';
                                }}
                              />
                            )}
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {item.quantity} {item.color && `• ${item.color}`}
                              </div>
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
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{parseFloat(order.subtotal.toString()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>
                        {parseFloat(order.shipping_cost.toString()) === 0 
                          ? 'Free' 
                          : `₹${parseFloat(order.shipping_cost.toString()).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>₹{parseFloat(order.total.toString()).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {order.payment_id && (
                    <p>Payment ID: {order.payment_id}</p>
                  )}
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/order-confirmation/${order.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 