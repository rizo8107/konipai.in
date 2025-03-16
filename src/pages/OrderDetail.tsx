import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { pocketbase, Collections } from '@/lib/pocketbase';
import { Loader2, ArrowLeft, Package, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

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

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [parsedItems, setParsedItems] = useState<OrderItem[]>([]);
  const [parsedAddress, setParsedAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    } else if (!user) {
      toast.error('Please login to view order details');
      navigate('/login');
    }
  }, [user, orderId]);

  // Parse JSON strings when order changes
  useEffect(() => {
    if (order) {
      try {
        // Items is stored as a JSON string in PocketBase
        const parsedItems = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : order.items;
        setParsedItems(parsedItems);
        
        // ShippingAddress is stored as a JSON string in PocketBase
        const parsedShippingAddress = typeof order.shippingAddress === 'string' 
          ? JSON.parse(order.shippingAddress) 
          : order.shippingAddress;
        setParsedAddress(parsedShippingAddress);
      } catch (error) {
        console.error('Error parsing order data:', error);
        setError('Error parsing order data. Please try again.');
      }
    }
  }, [order]);

  async function fetchOrderDetails() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching order details for order:', orderId);
      
      const response = await pocketbase.collection(Collections.ORDERS).getOne(orderId);
      
      console.log('Order details fetched successfully:', response);
      
      // Verify that the order belongs to the current user
      if (response.userId !== user?.$id) {
        setError('You do not have permission to view this order');
        return;
      }
      
      setOrder(response as unknown as Order);
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      setError(error.message || 'Failed to fetch order details');
      toast.error('Failed to load order details. Please try again.');
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
      <div className="konipai-container py-16">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !order || !parsedAddress) {
    return (
      <div className="konipai-container py-16">
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-red-300 rounded-lg bg-red-50">
          <p className="text-red-700 mb-4 text-center">{error || 'Order not found'}</p>
          <Button 
            onClick={() => navigate('/profile')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="konipai-container py-16">
      <div className="mb-8">
        <Button 
          onClick={() => navigate('/profile')}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.$id.slice(-6)}</h1>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.orderDate), 'MMMM d, yyyy')}
          </p>
        </div>
        <Badge 
          className={cn(
            "text-sm py-1 px-3",
            getStatusColor(order.status)
          )}
        >
          <Package className="h-4 w-4 mr-2" />
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parsedItems.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-4 border-b last:border-0"
                  >
                    <div className="flex flex-col">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <div className="flex justify-end pt-4 pb-2 space-x-4">
                  <div className="font-bold">Total:</div>
                  <div className="font-bold">₹{(order.totalAmount).toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p>{parsedAddress.street}</p>
                <p>
                  {parsedAddress.city}, {parsedAddress.state} {parsedAddress.zipCode}
                </p>
                <p>{parsedAddress.country}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 