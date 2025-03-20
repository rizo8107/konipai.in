import { CartItem } from '@/contexts/CartContext';

/**
 * Deduplicates cart items by combining items with the same product ID and color
 * @param items Array of cart items to deduplicate
 * @returns Deduplicated array of cart items
 */
export const deduplicateCartItems = (items: CartItem[]): CartItem[] => {
  const uniqueItems: CartItem[] = [];
  const itemMap: { [key: string]: CartItem } = {};

  items.forEach(item => {
    const itemKey = `${item.productId}-${item.color || 'Default'}`;
    if (!itemMap[itemKey]) {
      itemMap[itemKey] = { ...item };
      uniqueItems.push(itemMap[itemKey]);
    } else {
      itemMap[itemKey].quantity += item.quantity;
    }
  });

  return uniqueItems;
};

/**
 * Validates a cart item to ensure it has all required properties
 * @param item Cart item to validate
 * @returns Boolean indicating if the item is valid
 */
export const isValidCartItem = (item: unknown): boolean => {
  if (!item || typeof item !== 'object') return false;
  
  const cartItem = item as Partial<CartItem>;
  
  return !!(
    cartItem.productId &&
    cartItem.product && 
    typeof cartItem.quantity === 'number' && 
    cartItem.quantity > 0 &&
    typeof cartItem.product.price === 'number' &&
    !isNaN(cartItem.product.price)
  );
};
