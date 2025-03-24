import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  const [error, setError] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Optimized logo URLs
  const logoUrl = variant === 'light' 
    ? 'https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_3420988878/1kys736pdde433n/logowhite_osw0jj5ixs.svg?thumb=0x0'
    : 'https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_3420988878/m8l91o34i2i54z0/logo_lbgs7rzev4.svg?thumb=0x0';

  // Preload the logo
  useEffect(() => {
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
  }, [logoUrl]);

  if (error) {
    return <Loader2 className={cn("h-6 w-6 animate-spin", variant === 'light' ? "text-white" : "", className)} />;
  }

  return (
    <div className={cn("relative", className)}>
      {!loaded && <Loader2 className={cn("h-6 w-6 animate-spin absolute", variant === 'light' ? "text-white" : "")} />}
      <img 
        src={logoUrl} 
        alt="Logo" 
        className={cn("h-8", !loaded && "opacity-0", loaded && "opacity-100", "transition-opacity")}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
} 