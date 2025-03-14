import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { databases, DATABASE_ID, ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, loading, navigate]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardName: '',
    expDate: '',
    cvv: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
      toast.error('Please fill out all required fields');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to place an order');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format order data according to Appwrite schema
      const orderData = {
        userId: user.$id,
        status: 'pending',
        totalAmount: cartTotal,
        orderDate: new Date().toISOString(),
        // Convert items array to JSON string
        items: JSON.stringify(cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        }))),
        // Convert shippingAddress object to JSON string
        shippingAddress: JSON.stringify({
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        })
      };
      
      console.log('Creating order in Appwrite:', orderData);
      
      // Create order in Appwrite
      const response = await databases.createDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        ID.unique(),
        orderData
      );
      
      console.log('Order created successfully:', response);
      
      // Save order ID for reference
      setOrderId(response.$id);
      
      // Show success screen
      setOrderPlaced(true);
      
      // Clear cart after order is placed
      clearCart();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="konipai-container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="mb-8">There are no items in your cart to checkout.</p>
        <button
          onClick={() => navigate('/shop')}
          className="konipai-btn"
        >
          Continue Shopping
        </button>
      </div>
    );
  }
  
  if (orderPlaced) {
    return (
      <div className="konipai-container py-16 text-center">
        <div className="max-w-md mx-auto">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Thank You for Your Order!</h1>
          <p className="mb-4">
            Your order has been placed successfully. We've sent a confirmation email to {formData.email}.
          </p>
          <p className="mb-8">
            Order number: #{orderId ? orderId.slice(-6) : 'KP' + Math.floor(100000 + Math.random() * 900000)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="konipai-btn"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="konipai-btn-outline"
            >
              View Order in Profile
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="konipai-container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium mb-1">
                  Zip/Postal Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-6 mt-8">Payment Information</h2>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  id="credit-card"
                  name="paymentMethod"
                  value="credit-card"
                  checked={formData.paymentMethod === 'credit-card'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="credit-card">Credit Card</label>
              </div>
              
              {formData.paymentMethod === 'credit-card' && (
                <div className="pl-6 space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium mb-1">
                      Name on Card *
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expDate" className="block text-sm font-medium mb-1">
                        Expiration Date *
                      </label>
                      <input
                        type="text"
                        id="expDate"
                        name="expDate"
                        value={formData.expDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        className="w-full border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center mt-4">
                <input
                  type="radio"
                  id="paypal"
                  name="paymentMethod"
                  value="paypal"
                  checked={formData.paymentMethod === 'paypal'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="paypal">PayPal</label>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                type="submit" 
                className="konipai-btn w-full py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="bg-konipai-lightBeige p-6">
            <div className="mb-6">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.color}`} className="flex py-4 border-b border-gray-200">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium">
                        <h3>{item.name}</h3>
                        <p className="ml-4">${item.price.toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 capitalize">{item.color}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <p className="text-gray-500">Qty {item.quantity}</p>
                      <p className="text-right font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>${cartTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Shipping</p>
                <p>Calculated at next step</p>
              </div>
              <div className="flex justify-between">
                <p>Tax</p>
                <p>Calculated at next step</p>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <p>Total</p>
                <p>${cartTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
