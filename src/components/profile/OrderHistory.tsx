import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { databases, DATABASE_ID, ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ChevronRight, 
  ShoppingBag, 
  Calendar, 
  Filter, 
  ArrowUpDown,
  Package,
  AlertCircle,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Order {
  $id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  orderDate: string;
  // Items is stored as a JSON string in Appwrite
  items: string;
  // ShippingAddress is stored as a JSON string in Appwrite
  shippingAddress: string;
  $createdAt: string;
}

// Define the parsed item type
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

// Define the parsed shipping address type
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, statusFilter, sortBy]);

  async function fetchOrders() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching orders for user:', user.$id);
      
      const queries = [Query.equal('userId', user.$id)];
      
      if (statusFilter !== 'all') {
        queries.push(Query.equal('status', statusFilter));
      }

      // Add sorting
      switch (sortBy) {
        case 'date-desc':
          queries.push(Query.orderDesc('orderDate'));
          break;
        case 'date-asc':
          queries.push(Query.orderAsc('orderDate'));
          break;
        case 'total-desc':
          queries.push(Query.orderDesc('totalAmount'));
          break;
        case 'total-asc':
          queries.push(Query.orderAsc('totalAmount'));
          break;
      }

      console.log('Fetching orders with queries:', queries);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        queries
      );
      
      console.log('Orders fetched successfully:', response.documents.length);
      
      // Type assertion to convert Document[] to Order[]
      setOrders(response.documents as unknown as Order[]);
    } catch (error: unknown) {
      console.error('Failed to fetch orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error('Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: Order['status']) {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-red-300 rounded-lg bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-700 mb-4 text-center">{error}</p>
        <Button 
          onClick={() => fetchOrders()}
          variant="outline"
          className="gap-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium text-gray-900">Order History</h2>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-gray-500">Start shopping to see your orders here.</p>
          <Button asChild className="mt-4 bg-primary hover:bg-primary/90">
            <Link to="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.$id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      Order #{order.$id.slice(-6)}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      Placed on {new Date(order.$createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={
                      order.status === 'delivered' ? 'default' :
                      order.status === 'processing' ? 'secondary' :
                      order.status === 'cancelled' ? 'destructive' : 'outline'
                    }
                    className={cn(
                      'capitalize',
                      order.status === 'delivered' && 'bg-green-100 text-green-800',
                      order.status === 'processing' && 'bg-yellow-100 text-yellow-800',
                      order.status === 'cancelled' && 'bg-red-100 text-red-800'
                    )}
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {JSON.parse(order.items).map((item: OrderItem) => (
                    <div key={item.productId} className="flex items-center gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.productId}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-base font-medium text-gray-900">{item.name}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-medium text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-base">
                    <p className="font-medium text-gray-900">Total</p>
                    <p className="font-medium text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-gray-200 hover:bg-gray-50"
                  asChild
                >
                  <Link to={`/orders/${order.$id}`}>
                    <ChevronRight className="h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 