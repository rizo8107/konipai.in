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
  isLoading: boolean;
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
          } catch (serverError) {
            // Handle error but continue with local cart
            console.warn('Error fetching server cart:', serverError);
          }
        }

        // If we get here, either:
        // 1. User is not authenticated
        // 2. Server cart fetch failed
        // 3. Server cart was empty or invalid
        // Use the local items we loaded earlier
        setItems(localItems);
      } catch (error) {
        console.error('Error loading cart:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your cart. Please try refreshing the page.",
        });
        
        // Attempt to use local storage cart as fallback
        try {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (Array.isArray(parsedCart)) {
              setItems(parsedCart);
            }
          }
        } catch (e) {
          console.error('Could not load fallback cart:', e);
          // Initialize empty cart when all else fails
          setItems([]);
        }
      } finally {
        // Always set loading to false to prevent UI from being stuck in loading state
        setIsLoading(false);
      }
    };

    // Execute cart loading
    loadCart();
  }, [user, authLoading, toast]);

  const calculateTotals = (cartItems: CartItem[]) => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.product.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;

    return { subtotal, shipping, total };
  };

  // Sync cart with server whenever it changes
  useEffect(() => {
    // Don't sync while loading auth state
    if (authLoading) return;

    const syncCart = async () => {
      // Validate and clean cart items
      const validItems = items.filter(isValidCartItem);

      // Deduplicate items before saving
      const deduplicatedItems = deduplicateCartItems(validItems);
      
      // Always update local storage
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(deduplicatedItems));
      } catch (error) {
        console.warn('Failed to save cart to local storage:', error);
      }

      // Only attempt to sync if user is authenticated
      if (!user?.id) return;

      try {
        // Prepare cart items for server storage
        const cartData = {
          items: JSON.stringify(deduplicatedItems.map(item => ({
            productId: item.productId,
            product: {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              images: item.product.images,
            },
            quantity: item.quantity,
            color: item.color,
          }))),
          user: user.id,
        };

        // First check if the user has a cart - use the catch method to handle 404 cleanly
        const userCart = await pocketbase
          .collection('carts')
          .getFirstListItem(`user="${user.id}"`)
          .catch(() => null);

        if (!userCart) {
          // No cart exists, create a new one
          try {
            await pocketbase.collection('carts').create(cartData);
            console.log('Created new cart for user');
          } catch (createError) {
            console.warn('Unable to create cart:', createError);
          }
        } else if (userCart.id) {
          // Cart exists, update it
          try {
            await pocketbase.collection('carts').update(userCart.id, cartData);
            console.log('Updated existing cart');
          } catch (updateError) {
            console.warn('Unable to update cart:', updateError);
          }
        }
      } catch (error) {
        console.warn('Error syncing cart with server:', error);
      }
    };

    // Debounce the sync to avoid too many requests
    const timeoutId = setTimeout(syncCart, 1000);
    return () => clearTimeout(timeoutId);
  }, [items, user, authLoading]);

  const addItem = (product: Product, quantity: number, color: string) => {
    if (!product || !product.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add product to cart. Invalid product.",
      });
      return;
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a valid quantity.",
      });
      return;
    }

    setItems((currentItems) => {
      // Check if item already exists in cart with same color
      const existingItemIndex = currentItems.findIndex(
        (item) => item.productId === product.id && item.color === color
      );

      let newItems;

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        newItems = [...currentItems];
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
    isLoading,
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