import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Add global click/touch event listener to dismiss all toasts
  useEffect(() => {
    // Set a flag to track if we should dismiss
    let shouldDismiss = true;
    
    // When a toast appears, delay enabling the global click dismissal
    const observer = new MutationObserver(() => {
      if (document.querySelector('[role="status"]')) {
        shouldDismiss = false;
        setTimeout(() => {
          shouldDismiss = true;
        }, 300); // Small delay to prevent immediate dismissal
      }
    });
    
    // Watch for changes to the toast container
    const viewport = document.querySelector('[role="region"][aria-label="Notifications"]');
    if (viewport) {
      observer.observe(viewport, { childList: true, subtree: true });
    }

    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      // Skip if we shouldn't dismiss yet or if clicking inside a toast
      if (!shouldDismiss || 
          (e.target instanceof Element && 
           (e.target.closest('[role="status"]') || 
            e.target.closest('button')))) {
        return;
      }
      
      // Only dismiss if there are active toasts
      if (toasts.length > 0) {
        dismiss();
      }
    };

    // Add event listeners for both click and touch
    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);

    // Clean up event listeners
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
      observer.disconnect();
    };
  }, [toasts, dismiss]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
