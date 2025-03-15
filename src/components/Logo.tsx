import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  const [error, setError] = useState<boolean>(false);

  const logoUrl = variant === 'light' 
    ? 'https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_3420988878/1kys736pdde433n/logowhite_osw0jj5ixs.svg'
    : 'https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_3420988878/m8l91o34i2i54z0/logo_lbgs7rzev4.svg';

  if (error) {
    return <Loader2 className={cn("h-6 w-6 animate-spin", variant === 'light' ? "text-white" : "", className)} />;
  }

  return (
    <img 
      src={logoUrl} 
      alt="Logo" 
      className={cn("h-8", className)}
      onError={() => setError(true)}
    />
  );
} 