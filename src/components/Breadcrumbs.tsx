import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  id?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  isLoading?: boolean;
}

export function Breadcrumbs({ items, className, isLoading = false }: BreadcrumbsProps) {
  // Always ensure minimum height to prevent layout shifts
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn(
        "w-full min-h-[32px] flex items-center mb-4 text-sm text-muted-foreground",
        // Apply overflow protection for long breadcrumbs
        "overflow-x-auto scrollbar-hide", 
        className
      )}
    >
      {isLoading ? (
        // Loading state
        <ol className="flex flex-row items-center flex-nowrap gap-2">
          <li><Skeleton className="h-4 w-16" /></li>
          <li><ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" /></li>
          <li><Skeleton className="h-4 w-24" /></li>
        </ol>
      ) : (
        // Normal state
        <ol className="flex flex-row items-center flex-nowrap">
          {/* Home is always first */}
          <li className="flex items-center">
            <Link 
              to="/" 
              className="transition-colors hover:text-primary whitespace-nowrap"
            >
              Home
            </Link>
          </li>
          
          {/* Render path items */}
          {items.map((item, index) => (
            <li key={item.id || index} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" aria-hidden="true" />
              {item.href ? (
                <Link 
                  to={item.href}
                  className="transition-colors hover:text-primary whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium whitespace-nowrap" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
} 