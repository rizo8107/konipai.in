import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pocketbase, Collections } from '@/lib/pocketbase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2, Truck, Package, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrderItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  created: string;
  updated: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
}

// Function to get badge color based on order status
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'processing': return 'default';
    case 'shipped': return 'secondary';
    case 'delivered': return 'success';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await pocketbase.collection(Collections.ORDERS).getList(1, 50, {
          filter: `user = "${user.id}"`,
          sort: '-created',
        });

        // Process the orders
        const processedOrders = response.items.map(order => {
          // Items is stored as a JSON string in PocketBase
          const parsedItems = typeof order.products === 'string' 
            ? JSON.parse(order.products) 
            : order.products;

          // ShippingAddress is stored as a JSON string in PocketBase
          const parsedAddress = typeof order.shippingAddress === 'string' && order.shippingAddress
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress;

          return {
            id: order.id,
            created: order.created,
            updated: order.updated,
            status: order.status,
            totalAmount: order.totalAmount,
            items: parsedItems,
            shippingAddress: parsedAddress
          };
        });

        setOrders(processedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load order history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Orders Yet</CardTitle>
          <CardDescription>
            You haven't placed any orders yet. Start shopping to see your order history here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button asChild>
            <Link to="/shop">Start Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Order History</h2>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                  <CardDescription>
                    Placed on {format(new Date(order.created), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Button variant="outline" asChild size="sm">
                    <Link to={`/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 py-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.slice(0, 2).map(item => item.name).join(', ')}
                      {order.items.length > 2 ? `, +${order.items.length - 2} more` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <div className="p-4 flex items-center gap-3 bg-primary/5">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {order.status === 'delivered' 
                        ? 'Delivered' 
                        : 'Shipped'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.status === 'delivered'
                        ? `Delivered on ${format(new Date(order.updated), 'MMM d, yyyy')}`
                        : `Expected delivery by ${format(
                            new Date(new Date(order.updated).getTime() + 5 * 24 * 60 * 60 * 1000), 
                            'MMM d, yyyy'
                          )}`
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 