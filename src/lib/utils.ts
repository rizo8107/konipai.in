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

/**
 * Loads a script dynamically and returns a promise
 * @param src - The script source URL
 * @param id - The ID to assign to the script tag
 * @returns Promise that resolves when the script is loaded
 */
export function loadScript(src: string, id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.getElementById(id)) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
}
