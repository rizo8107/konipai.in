import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingBag, Search } from 'lucide-react';
import { pocketbase } from '@/lib/pocketbase';
import { trackButtonClick, trackFormStart, trackFormCompletion, trackFormError } from '@/lib/analytics';

export default function OrderTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track form start when component mounts
  useState(() => {
    document.title = 'Track Your Order | Konipai';
    trackFormStart('order_tracking_form', 'order-tracking');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!orderId.trim()) {
      setError('Please enter your order ID');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Track button click
      trackButtonClick('track_order_submit', 'Track Order', window.location.pathname);
      
      // First try to find the order by ID
      const order = await pocketbase.collection('orders').getOne(orderId).catch(() => null);
      
      // If order not found or email doesn't match
      if (!order || order.customer_email.toLowerCase() !== email.toLowerCase()) {
        setError('No order found with this ID and email combination');
        trackFormError('order_tracking_form', 'order-tracking', 'Invalid order ID or email');
        return;
      }
      
      // Track successful form completion
      trackFormCompletion('order_tracking_form', 'order-tracking');
      
      // Navigate to order confirmation page
      toast({
        title: "Order Found",
        description: `Redirecting to order #${orderId} details...`,
      });
      
      navigate(`/order-confirmation/${orderId}`);
      
    } catch (error) {
      console.error('Error tracking order:', error);
      setError('Failed to find your order. Please try again.');
      trackFormError('order_tracking_form', 'order-tracking', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter your order details to check the status
        </p>
      </div>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., abc123def456"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="The email used during checkout"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm pt-1">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Searching...' : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track Order
                </>
              )}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Have an account?</p>
          <Link to="/orders" className="text-primary hover:underline">
            View all your orders
          </Link>
        </div>
      </Card>
    </div>
  );
}
