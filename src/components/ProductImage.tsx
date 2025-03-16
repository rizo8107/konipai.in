import { useState, useEffect, memo } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Collections } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { getPocketBaseImageUrl } from '@/utils/imageOptimizer';

interface ProductImageProps {
    url: string;
    alt: string;
    className?: string;
    priority?: boolean; // For above-the-fold images
    width?: number;
    height?: number;
}

export const ProductImage = memo(function ProductImage({ 
    url, 
    alt, 
    className,
    priority = false,
    width,
    height
}: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setError('No image URL provided');
            setIsLoading(false);
            return;
        }

        try {
            const fullUrl = getPocketBaseImageUrl(url, Collections.PRODUCTS);
            if (fullUrl) {
                setImageUrl(fullUrl);
            } else {
                setError('Failed to process image URL');
            }
            setIsLoading(false);
        } catch (err) {
            console.error('Error loading image:', err);
            setError('Failed to load image');
            setIsLoading(false);
        }
    }, [url]);

    if (isLoading) {
        return (
            <div 
                className={cn("animate-pulse bg-muted", className)} 
                style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div 
                className={cn("bg-muted flex items-center justify-center", className)}
                style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
            >
                <ImageIcon className="h-6 w-6 text-muted-foreground" aria-label="Image failed to load" />
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={cn("object-cover", className)}
            loading={priority ? "eager" : "lazy"}
            width={width}
            height={height}
            decoding={priority ? "sync" : "async"}
        />
    );
}); 