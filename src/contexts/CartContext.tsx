import { createContext, useContext, useEffect, useState } from 'react';
import { Product, pocketbase } from '@/lib/pocketbase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { deduplicateCartItems, isValidCartItem } from '@/utils/cartUtils';
import { trackEcommerceEvent } from '@/utils/analytics';

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  color: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, color: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string, color?: string) => CartItem | undefined;
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  subtotal: number;
  total: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'konipai_cart';
const SHIPPING_THRESHOLD = 100; // Free shipping over ₹100
const SHIPPING_COST = 10;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from local storage and sync with server on mount or auth state change
  useEffect(() => {
    // Don't load cart while auth state is being determined
    if (authLoading) return;

    const loadCart = async () => {
      try {
        setIsLoading(true);
        
        // First, try to load from local storage
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        let localItems: CartItem[] = [];

        if (savedCart && savedCart.trim() !== '') {
          try {
            const parsedCart = JSON.parse(savedCart);
            if (Array.isArray(parsedCart)) {
              // Validate cart items
              localItems = parsedCart.filter(isValidCartItem);
              
              // Deduplicate local items based on productId+color
              localItems = deduplicateCartItems(localItems);
            } else {
              console.warn('Local cart is not an array:', parsedCart);
            }
          } catch (parseError) {
            console.warn('Failed to parse local cart:', parseError);
            localStorage.removeItem(CART_STORAGE_KEY);
          }
        }

        // If user is authenticated, try to sync with server
        if (user?.id) {
          try {
            // Catch for invalid or nonexistent cart
            const serverCart = await pocketbase
              .collection('carts')
              .getFirstListItem(`user="${user.id}"`)
              .catch(error => {
                console.log('No existing cart found or error:', error);
                return null;
              });
            
            if (serverCart && serverCart.items && typeof serverCart.items === 'string' && serverCart.items.trim() !== '') {
              try {
                const serverItems = JSON.parse(serverCart.items);
                
                if (Array.isArray(serverItems)) {
                  const validItems = serverItems.filter(isValidCartItem);
                  
                  // Deduplicate server items
                  const deduplicatedServerItems = deduplicateCartItems(validItems);

                  // If server has items, use those instead of local items
                  if (deduplicatedServerItems.length > 0) {
                    setItems(deduplicatedServerItems);
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(deduplicatedServerItems));
                    setIsLoading(false);
                    return;
                  }
                } else {
                  console.warn('Server cart items is not an array:', serverItems);
                }
              } catch (parseError) {
                console.warn('Failed to parse server cart items:', parseError);
              }
            }
          } catch (error) {
            console.warn('Error fetching cart from server:', error);
          }
          
          // If we get here, either there was no server cart or it was invalid
          // Use local items and sync to server
          if (localItems.length > 0) {
            try {
              await syncCart();
            } catch (syncError) {
              console.warn('Failed to sync local cart to server:', syncError);
            }
          }
        }
        
        // If we get here, use local items
        setItems(localItems);
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to empty cart
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user, authLoading]);

  // Calculate totals
  const calculateTotals = (cartItems: CartItem[]) => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (Number(item.product.price) || 0) * (Number(item.quantity) || 0),
      0
    );
    
    // Add shipping if below threshold
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;
    
    return { subtotal, shipping, total };
  };

  // Sync cart with server whenever items change
  useEffect(() => {
    if (isLoading || authLoading) return;
    syncCart();
  }, [items, user, isLoading, authLoading]);

  // Sync cart to server
  const syncCart = async () => {
    if (!user) {
      console.log('No user, skipping cart sync');
      return;
    }

    if (!pocketbase.authStore.isValid) {
      console.warn('Auth token invalid, skipping cart sync');
      return;
    }

    try {
      setIsSyncing(true);
      console.log('Starting cart sync for user:', user.id);

      // Prepare cart data for API
      const cartData = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color || null
      }));

      // Check if user already has a cart
      let existingCart = null;
      try {
        const cartRecords = await pocketbase.collection('carts').getList(1, 1, {
          filter: `user="${user.id}"`,
        });
        
        if (cartRecords.items.length > 0) {
          existingCart = cartRecords.items[0];
          console.log('Found existing cart:', existingCart.id);
        }
      } catch (error) {
        console.warn('Error checking for existing cart:', error);
        // Continue with creation flow if we couldn't check for existing cart
      }

      // Create a new cart with retry logic
      const createCartWithRetry = async (retries = 3, delay = 1000) => {
        // Ensure user is still authenticated
        if (!pocketbase.authStore.isValid) {
          console.warn('Auth token invalid, skipping cart creation');
          return null;
        }

        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            console.log(`Creating new cart (attempt ${attempt + 1}/${retries})`);
            
            // Create a new cart record
            return await pocketbase.collection('carts').create({
              user: user.id,
              items: cartData
            });
          } catch (error: any) {
            console.error(`Cart creation failed (attempt ${attempt + 1}/${retries}):`, error);
            
            // If this is a 400 error, log more details
            if (error.status === 400) {
              console.error('Validation error details:', error.data);
            }
            
            // If we have more retries, wait before trying again
            if (attempt < retries - 1) {
              // Exponential backoff
              const backoffDelay = delay * Math.pow(2, attempt);
              console.log(`Retrying in ${backoffDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else {
              throw error; // Re-throw the last error
            }
          }
        }
        return null; // Should never reach here due to throw above
      };

      // Update existing cart with retry logic
      const updateCartWithRetry = async (cartId: string, retries = 3, delay = 1000) => {
        // Ensure user is still authenticated
        if (!pocketbase.authStore.isValid) {
          console.warn('Auth token invalid, skipping cart update');
          return null;
        }

        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            console.log(`Updating cart ${cartId} (attempt ${attempt + 1}/${retries})`);
            
            // Update the existing cart
            return await pocketbase.collection('carts').update(cartId, {
              items: cartData
            });
          } catch (error: any) {
            console.error(`Cart update failed (attempt ${attempt + 1}/${retries}):`, error);
            
            // If this is a 400 error, log more details
            if (error.status === 400) {
              console.error('Validation error details:', error.data);
            }
            
            // If we have more retries, wait before trying again
            if (attempt < retries - 1) {
              // Exponential backoff
              const backoffDelay = delay * Math.pow(2, attempt);
              console.log(`Retrying in ${backoffDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else {
              throw error; // Re-throw the last error
            }
          }
        }
        return null; // Should never reach here due to throw above
      };

      // Either update existing cart or create a new one
      if (existingCart) {
        await updateCartWithRetry(existingCart.id);
        console.log('Cart updated successfully');
      } else {
        await createCartWithRetry();
        console.log('New cart created successfully');
      }

      setIsSyncing(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to sync cart:', error);
      setIsSyncing(false);
      
      // Don't show error toast for network issues in production
      // as it can be annoying for users with intermittent connections
      if (import.meta.env.MODE !== 'production') {
        toast({
          title: 'Cart Sync Error',
          description: 'Failed to sync your cart with the server. Your items are saved locally.',
          variant: 'destructive',
        });
      }
    }
  };

  // Add item to cart
  const addItem = (product: Product, quantity: number, color: string) => {
    setItems((currentItems) => {
      // Create a copy of the current items
      let newItems = [...currentItems];
      
      // Check if item already exists in cart
      const existingItemIndex = newItems.findIndex(
        (item) => item.productId === product.id && item.color === color
      );
      
      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        };
      } else {
        // Add new item if it doesn't exist
        newItems = [
          ...currentItems,
          {
            productId: product.id,
            product,
            quantity,
            color,
          },
        ];
      }

      // Track the add to cart event for Google Analytics
      trackEcommerceEvent('add_to_cart', [{
        item_id: product.id,
        item_name: product.name,
        price: Number(product.price) || 0,
        quantity: quantity,
        item_variant: color || undefined
      }]);

      setIsCartOpen(true);

      toast({
        variant: "success",
        title: "Added to Cart",
        description: `${product.name} x${quantity} added to your cart.`,
      });

      return newItems;
    });
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) => {
      const itemToRemove = currentItems.find(item => item.productId === productId);
      
      if (itemToRemove) {
        // Track removal in Google Analytics
        trackEcommerceEvent('remove_from_cart', [{
          item_id: itemToRemove.productId,
          item_name: itemToRemove.product.name,
          price: Number(itemToRemove.product.price) || 0,
          quantity: itemToRemove.quantity,
          item_variant: itemToRemove.color || undefined
        }]);
      }
      
      return currentItems.filter((item) => item.productId !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find(item => item.productId === productId);
      const oldQuantity = existingItem ? existingItem.quantity : 0;
      
      const newItems = currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      
      if (existingItem && quantity !== oldQuantity) {
        // Track quantity update in Google Analytics
        if (quantity > oldQuantity) {
          // Added more items
          trackEcommerceEvent('add_to_cart', [{
            item_id: existingItem.productId, 
            item_name: existingItem.product.name,
            price: Number(existingItem.product.price) || 0,
            quantity: quantity - oldQuantity,
            item_variant: existingItem.color || undefined
          }]);
        } else {
          // Removed some items
          trackEcommerceEvent('remove_from_cart', [{
            item_id: existingItem.productId,
            item_name: existingItem.product.name,
            price: Number(existingItem.product.price) || 0,
            quantity: oldQuantity - quantity,
            item_variant: existingItem.color || undefined
          }]);
        }
      }
      
      return newItems;
    });
  };

  const clearCart = () => {
    // Don't track this in analytics since it's usually after checkout or other events
    setItems([]);
  };

  const getItem = (productId: string, color?: string): CartItem | undefined => {
    return items.find(item => 
      item.productId === productId &&
      (!color || item.color === color)
    );
  };

  const { subtotal, total } = calculateTotals(items);

  const itemCount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
    isLoading,
    isSyncing,
    lastSynced,
    subtotal,
    total,
    itemCount,
    isCartOpen,
    setIsCartOpen,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}