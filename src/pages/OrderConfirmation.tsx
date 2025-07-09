import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { pocketbase } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingBag, CheckCircle, Package, Receipt, Loader2, Copy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { trackPurchase, trackPageView, trackDynamicConversion } from '@/lib/analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define interfaces for products in order
interface OrderProduct {
  productId?: string;
  product?: {
    id?: string;
    name?: string;
    price?: number;
    images?: string[];
  };
  name?: string;
  price?: number;
  quantity: number;
  color?: string;
  discount?: number;
  coupon?: string;
}

// Define interface for order
interface Order {
  id: string;
  products: string | OrderProduct[];
  subtotal: number;
  total: number;
  shipping_cost: number | null;
  payment_status: string;
  payment_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  coupon_code?: string;
  discount_amount?: number;
  is_guest_order?: boolean;
  expand?: {
    shipping_address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    user?: {
      id: string;
      email: string;
    };
  };
  tax?: number;
  shipping_address_text?: string;
}

// Lazy load the OrderInvoice component
const OrderInvoice = lazy(() => import('@/components/OrderInvoice').then(module => ({ default: module.OrderInvoice })));

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('status');
  
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("order");

  useEffect(() => {
    document.title = 'Order Confirmation | Konipai';
    
    // Track page view with GTM
    trackPageView(
      'Order Confirmation', 
      window.location.pathname
    );
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        if (!orderId) {
          setError('Order ID not found');
          setLoading(false);
          return;
        }
        
        console.log(`Fetching order details for order ID: ${orderId}`);
        
        const orderData = await pocketbase.collection('orders').getOne(orderId, {
          expand: 'user,shipping_address'
        });
        
        console.log('Fetched order data:', {
          id: orderData.id,
          status: orderData.status,
          payment_status: orderData.payment_status,
          payment_id: orderData.payment_id,
          has_shipping_address: !!orderData.expand?.shipping_address,
          has_shipping_address_text: !!orderData.shipping_address_text
        });
        
        // Parse shipping address from text field
        let parsedShippingAddress = null;
        
        if (orderData.shipping_address_text) {
          try {
            console.log('Parsing shipping address from text field');
            parsedShippingAddress = JSON.parse(orderData.shipping_address_text);
            console.log('Successfully parsed shipping address:', parsedShippingAddress);
            
            // Add the shipping address to the expanded data
            orderData.expand = orderData.expand || {};
            orderData.expand.shipping_address = parsedShippingAddress;
          } catch (addressError) {
            console.error('Failed to parse shipping address:', addressError);
          }
        }
        
        // Set the order in state
        setOrder(orderData as unknown as Order);
        
        // Track purchase
        if (orderData && paymentStatus === 'success') {
          try {
            console.log('Tracking purchase event');
            
            // Parse the products array from the order
            let orderProducts: OrderProduct[] = [];
            
            if (typeof orderData.products === 'string') {
              try {
                orderProducts = JSON.parse(orderData.products);
              } catch (e) {
                console.error('Failed to parse order products:', e);
              }
            } else if (Array.isArray(orderData.products)) {
              orderProducts = orderData.products;
            }
            
            // Format products for analytics
            const items = orderProducts.map(item => ({
              item_id: item.productId || item.product?.id || '',
              item_name: item.name || item.product?.name || 'Product',
              price: Number(item.price || item.product?.price || 0),
              quantity: item.quantity || 1,
              item_variant: item.color || undefined
            }));
            
            // Track the purchase event
            trackPurchase(
              items,
              orderData.id,
              orderData.total,
              orderData.shipping_cost || 0,
              orderData.tax || 0,
              orderData.coupon_code
            );
            
            // Track conversion for Meta Pixel
            trackDynamicConversion({
              transaction_id: orderData.id,
              value: orderData.total,
              shipping: orderData.shipping_cost || 0,
              tax: orderData.tax || 0,
              currency: 'INR',
              items: items,
              conversion_type: 'Purchase'
            });
          } catch (analyticsError) {
            console.error('Failed to track purchase:', analyticsError);
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, paymentStatus]);

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
  let products: OrderProduct[] = [];
  try {
    // Check if products is a string that needs parsing
    if (typeof order.products === 'string') {
      products = JSON.parse(order.products || '[]');
    } else {
      // Products is already an object
      products = order.products as OrderProduct[];
    }
  } catch (err) {
    console.error('Error parsing products:', err);
    products = [];
  }

  const shippingAddress = order.expand?.shipping_address;
  
  // Check for any of the valid "paid" payment statuses
  const isPaid = ['paid', 'captured', 'authorized'].includes(order.payment_status);
  
  console.log('Payment status check:', {
    status: order.payment_status,
    isPaid: isPaid,
    paymentId: order.payment_id
  });

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
        
        {/* Show special message for guest checkout orders with order tracking info */}
        {(order.is_guest_order || !order.expand?.user) && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
            <p>You completed this order as a guest. Order details have been sent to {order.customer_email}.</p>
            <p className="text-sm mt-1">To track this order in the future, bookmark this page or save this link:</p>
            <div className="mt-2 flex items-center justify-between bg-white p-2 rounded border">
              <code className="text-xs sm:text-sm truncate">{window.location.href}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "Link Copied",
                    description: "Order tracking link copied to clipboard"
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm mt-3">Create an account to track all your orders in one place and get faster checkout next time.</p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="order" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Details
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoice
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="order" className="mt-4">
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {products.map((item, index) => (
                <div key={index} className="flex justify-between py-3 border-b">
                  <div className="flex">
                    <div className="w-16 h-16 rounded-md overflow-hidden mr-4 bg-gray-100 flex-shrink-0">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <img
                          src={`${import.meta.env.VITE_POCKETBASE_URL.replace(/\/$/, '')}/api/files/pbc_4092854851/${item.product.id}/${item.product.images[0].split('/').pop()}`}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                          loading="eager"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Image load error:', e.currentTarget.src);
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <ShoppingBag className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.product?.name || 'Product'}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} {item.color && `• Color: ${item.color}`}
                      </p>
                    </div>
                  </div>
                  <div className="font-medium">{formatCurrency((item.product?.price || 0) * item.quantity)}</div>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {order.shipping_cost === null || order.shipping_cost === undefined || isNaN(parseFloat(order.shipping_cost.toString()))
                    ? 'Free'
                    : parseFloat(order.shipping_cost.toString()) === 0
                      ? 'Free'
                      : formatCurrency(order.shipping_cost)}
                </span>
              </div>
              {order.discount_amount && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
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
        </TabsContent>
        
        <TabsContent value="invoice" className="mt-4">
          {isPaid ? (
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto" />}>
              <OrderInvoice order={order} products={products} />
            </Suspense>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Invoice Not Available</h2>
                <p className="text-muted-foreground mb-4">
                  An invoice will be available once your payment has been confirmed.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col space-y-4 mt-8">
        <div className="flex justify-center space-x-4">
          {/* Only show View All Orders button for logged-in users */}
          {!order.is_guest_order && order.expand?.user ? (
            <Button asChild variant="outline" className="w-full">
              <Link to="/orders">View All Orders</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
        
        {/* Show track order link for guest users */}
        {(order.is_guest_order || !order.expand?.user) && (
          <div className="text-center">
            <Link to="/track-order" className="text-primary hover:underline text-sm">
              Need to track another order? Use our order tracking page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}