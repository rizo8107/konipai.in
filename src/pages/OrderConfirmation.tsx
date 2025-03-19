import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pocketbase } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, ShoppingBag, Loader2 } from 'lucide-react';

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError('Order ID is missing');
          setLoading(false);
          return;
        }

        const orderData = await pocketbase.collection('orders').getOne(orderId, {
          expand: 'shipping_address,user',
        });

        setOrder(orderData);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order details. Please try again later.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load order details. Please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, toast]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">{error || 'Could not find the requested order.'}</p>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  // Parse the products from the JSON string if it's a string, otherwise use as is
  let products = [];
  try {
    // Check if products is a string that needs parsing
    if (typeof order.products === 'string') {
      products = JSON.parse(order.products || '[]');
    } else {
      // Products is already an object
      products = order.products || [];
    }
  } catch (err) {
    console.error('Error parsing products:', err);
    products = [];
  }

  const shippingAddress = order.expand?.shipping_address;
  const isPaid = order.payment_status === 'paid';

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          {isPaid 
            ? 'Your payment was successful and your order has been placed.' 
            : 'Your order has been placed but payment confirmation is pending.'}
        </p>
        <p className="font-medium mt-2">Order #{order.id}</p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2">
          {products.map((item: any, index: number) => (
            <div key={index} className="flex justify-between py-1">
              <span className="text-gray-600">
                {item.product.name} × {item.quantity}
                {item.color && ` (${item.color})`}
              </span>
              <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">₹{parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {parseFloat(order.shipping_cost) === 0 
                ? 'Free' 
                : `₹${parseFloat(order.shipping_cost).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between py-1 font-semibold">
            <span>Total</span>
            <span>₹{parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {shippingAddress && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
          <p className="font-medium">{order.customer_name}</p>
          <p>{shippingAddress.street}</p>
          <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
          <p>{shippingAddress.country}</p>
          <p className="mt-2">Phone: {order.customer_phone}</p>
          <p>Email: {order.customer_email}</p>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <p className="font-medium">{isPaid ? 'Paid' : 'Payment Pending'}</p>
        </div>
        {order.payment_id && (
          <p className="text-sm text-gray-600 mt-2">
            Payment ID: {order.payment_id}
          </p>
        )}
        <div className="flex items-center mt-4 space-x-2">
          <img src="/razorpay-logo.svg" alt="Razorpay" className="h-5" onError={(e) => (e.currentTarget.src = 'https://razorpay.com/assets/razorpay-logo.svg')} />
          <p className="text-sm text-gray-600">Paid via Razorpay</p>
        </div>
      </Card>

      <div className="flex justify-center space-x-4 mt-8">
        <Button asChild variant="outline">
          <Link to="/account/orders">View All Orders</Link>
        </Button>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
} 