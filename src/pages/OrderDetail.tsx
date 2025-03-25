import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  color?: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  user: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  shipping_cost: number;
  products: string; // JSON string of order items
  shippingAddress: string; // ID of the address record
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: string;
  created: string;
  updated: string;
  coupon_code?: string;
  discount_amount?: number;
  expand?: {
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
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

  async function fetchOrderDetails() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching order details for order:', orderId);
      
      const response = await pocketbase.collection('orders').getOne(orderId, {
        expand: 'shippingAddress'
      });
      
      console.log('Order details fetched successfully:', response);
      console.log('Logged in user:', user);
      
      // Temporarily remove the user verification check during debugging
      /*
      if (response.user !== user?.id) {
        setError('You do not have permission to view this order');
        return;
      }
      */
      
      setOrder(response as unknown as Order);

      // Parse products JSON
      try {
        console.log('Order object structure:', JSON.stringify(response));
        
        const productsData = typeof response.products === 'string' 
          ? JSON.parse(response.products) 
          : response.products;
        setParsedItems(productsData);
        
        // Handle shipping address from expand
        if (response.expand?.shippingAddress) {
          setParsedAddress({
            street: response.expand.shippingAddress.street || '',
            city: response.expand.shippingAddress.city || '',
            state: response.expand.shippingAddress.state || '',
            zipCode: response.expand.shippingAddress.postalCode || '',
            country: response.expand.shippingAddress.country || ''
          });
        }
      } catch (error) {
        console.error('Error parsing order data:', error);
        setError('Error parsing order data. Please try again.');
      }
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
          <h1 className="text-3xl font-bold">Order #{order.id.slice(-6)}</h1>
          <p className="text-muted-foreground">
            {order.created && !isNaN(new Date(order.created).getTime()) ? (
              <>Placed on {format(new Date(order.created), 'MMMM d, yyyy')}</>
            ) : (
              'Processing date...' 
            )}
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
                {parsedItems && parsedItems.length > 0 ? (
                  parsedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-4 border-b last:border-0"
                    >
                      <div className="flex flex-col">
                        <p className="font-medium">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ₹{(item.product?.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        ₹{(item.quantity * (item.product?.price || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No items found</p>
                )}
                
                <div className="flex justify-end pt-4 pb-2 space-x-4">
                  <div className="font-bold">Total:</div>
                  <div className="font-bold">₹{order.total ? order.total.toFixed(2) : '0.00'}</div>
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