import { useTheme } from "next-themes"
import { useEffect } from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  // Add global click/touch event listener to dismiss toasts
  useEffect(() => {
    // Set a flag to track if we should dismiss
    let shouldDismiss = true;
    
    // Create an observer to watch for new toasts
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldDismiss = false;
          setTimeout(() => {
            shouldDismiss = true;
          }, 300); // Small delay to prevent immediate dismissal
          break;
        }
      }
    });
    
    // Start observing the body for toast additions
    observer.observe(document.body, { childList: true, subtree: true });

    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      // Skip if we shouldn't dismiss yet or if clicking on a toast or button
      if (!shouldDismiss || 
          (e.target instanceof Element && 
           (e.target.closest('[data-sonner-toast]') || 
            e.target.closest('button')))) {
        return;
      }
      
      // Check if there are any active toasts
      const toastElements = document.querySelectorAll('[data-sonner-toast]');
      if (toastElements.length > 0) {
        // If there are toasts, dismiss them all
        toast.dismiss();
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
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-[9999]"
      position="top-right"
      expand={false}
      closeButton
      richColors
      duration={2000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:p-3 group-[.toaster]:max-w-[320px] group-[.toaster]:text-xs z-[9999]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
