import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { pocketbase } from '@/lib/pocketbase';
import { useToast } from '@/components/ui/use-toast';

interface OrderItem {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  color: string;
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
  created: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    expand?: ShippingAddress;
  };
  products: string; // JSON string of OrderItem[]
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_status: string;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth state first
    if (authLoading) return;

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to view your order.",
      });
      navigate('/auth/login');
      return;
    }

    const loadOrder = async () => {
      if (!orderId) {
        setError('No order ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const record = await pocketbase.collection('orders').getOne(orderId, {
          expand: 'shipping_address',
        });

        // Verify order belongs to current user
        if (record.user !== user.id) {
          setError('You do not have permission to view this order');
          setIsLoading(false);
          return;
        }

        // Cast the record to our Order type
        const orderData = record as unknown as Order;
        setOrder(orderData);

        // Parse the products JSON string
        try {
          const products = typeof orderData.products === 'string' && orderData.products.trim() !== ''
            ? JSON.parse(orderData.products)
            : [];

          if (Array.isArray(products)) {
            setOrderItems(products);
          } else {
            console.warn('Products data is not an array:', products);
            setOrderItems([]);
          }
        } catch (parseError) {
          console.error('Failed to parse order products:', parseError);
          setOrderItems([]);
        }
      } catch (err) {
        console.error('Failed to load order:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, user, authLoading, navigate, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="konipai-container py-12">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link to="/profile">Go to Profile</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Get shipping address details safely
  const shippingAddress = order.shipping_address?.expand;

  return (
    <div className="konipai-container py-12">
      <Card className="p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-gray-600">
            Order #{order.id} has been successfully placed
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">
                      Color: {item.color} • Quantity: {item.quantity}
                    </p>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.product.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-2">
              <p>{order.customer_name}</p>
              {shippingAddress && (
                <>
                  <p>{shippingAddress.street}</p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{' '}
                    {shippingAddress.zipCode}
                  </p>
                  <p>{shippingAddress.country}</p>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link to="/profile">View Orders</Link>
          </Button>
          <Button asChild>
            <Link to="/shop">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
} 