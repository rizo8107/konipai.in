import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indian Rupees
 * @param amount - The amount to format (in rupees or paisa)
 * @param inPaisa - Whether the amount is in paisa (default: false)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | null | undefined, inPaisa = false): string {
  if (amount === null || amount === undefined) return '₹0.00';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '₹0.00';
  
  // If amount is in paisa, convert to rupees
  const rupeeAmount = inPaisa ? numericAmount / 100 : numericAmount;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupeeAmount);
}
