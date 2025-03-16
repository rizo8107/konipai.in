import { useState, useEffect, memo } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Collections } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { getPocketBaseImageUrl, getResponsiveImageSources, ImageSize } from '@/utils/imageOptimizer';

interface ProductImageProps {
    url: string;
    alt: string;
    className?: string;
    priority?: boolean; // For above-the-fold images
    width?: number;
    height?: number;
    size?: ImageSize;
    useResponsive?: boolean;
}

export const ProductImage = memo(function ProductImage({ 
    url, 
    alt, 
    className,
    priority = false,
    width,
    height,
    size = "medium",
    useResponsive = true
}: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [sources, setSources] = useState<Array<{srcSet: string, media: string, type: string}>>([]);

    useEffect(() => {
        if (!url) {
            setError('No image URL provided');
            setIsLoading(false);
            return;
        }

        try {
            if (useResponsive) {
                // Set sources for responsive image loading
                setSources(getResponsiveImageSources(url, Collections.PRODUCTS));
                
                // Set fallback image URL (non-WebP)
                const fallbackUrl = getPocketBaseImageUrl(url, Collections.PRODUCTS, size, "jpeg");
                setImageUrl(fallbackUrl);
            } else {
                // Use WebP format for better compression
                const optimizedUrl = getPocketBaseImageUrl(url, Collections.PRODUCTS, size, "webp");
                setImageUrl(optimizedUrl);
            }
            
            setIsLoading(false);
        } catch (err) {
            console.error('Error loading image:', err);
            setError('Failed to load image');
            setIsLoading(false);
        }
    }, [url, size, useResponsive]);

    if (isLoading) {
        return (
            <div 
                className={cn("animate-pulse bg-muted", className)} 
                style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
                aria-label="Loading image"
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
                aria-label="Image not available"
            >
                <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
        );
    }

    // Use picture element for responsive images
    if (useResponsive && sources.length > 0) {
        return (
            <picture>
                {sources.map((source, index) => (
                    <source key={index} srcSet={source.srcSet} media={source.media} type={source.type} />
                ))}
                <img
                    src={imageUrl}
                    alt={alt}
                    className={cn("object-cover w-full h-full", className)}
                    loading={priority ? "eager" : "lazy"}
                    width={width}
                    height={height}
                    decoding={priority ? "sync" : "async"}
                />
            </picture>
        );
    }

    // Fallback to regular img tag
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