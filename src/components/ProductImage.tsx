import { useState, useEffect, memo, useRef } from 'react';
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
    aspectRatio?: "square" | "portrait" | "landscape"; // Added aspect ratio option
}

export const ProductImage = memo(function ProductImage({ 
    url, 
    alt, 
    className,
    priority = false,
    width,
    height,
    size = "medium",
    useResponsive = true,
    aspectRatio = "square" // Default to square aspect ratio
}: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [sources, setSources] = useState<Array<{srcSet: string, media: string, type: string}>>([]);
    const imgRef = useRef<HTMLImageElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    // Define aspect ratio classes
    const aspectRatioClasses = {
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        landscape: "aspect-[4/3]",
    };

    useEffect(() => {
        if (!url) {
            setError('No image URL provided');
            setIsLoading(false);
            return;
        }

        try {
            // Always load tiny thumbnail for blur-up effect
            const tinyThumb = getPocketBaseImageUrl(url, Collections.PRODUCTS, "thumbnail", "webp");
            setThumbnailUrl(tinyThumb);
            
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
            
            // If image is a priority image, we'll keep isLoading true until the image loads
            // Otherwise mark loading as false since we'll load it when it comes into view
            if (!priority) {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error loading image:', err);
            setError('Failed to load image');
            setIsLoading(false);
        }
    }, [url, size, useResponsive, priority]);

    useEffect(() => {
        // Set up intersection observer for non-priority images
        if (!priority && imgRef.current) {
            observer.current = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Start actual loading when image is in viewport
                        const img = entry.target as HTMLImageElement;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                        }
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                        }
                        
                        // Once we've started loading, disconnect observer
                        if (observer.current) {
                            observer.current.disconnect();
                        }
                    }
                });
            }, {
                rootMargin: '200px', // Start loading when image is 200px from viewport
                threshold: 0
            });
            
            observer.current.observe(imgRef.current);
        }
        
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [priority, imageUrl]);

    // Handle image load completion
    const handleImageLoad = () => {
        setIsLoading(false);
    };

    if (error || !imageUrl) {
        return (
            <div 
                className={cn("bg-muted flex items-center justify-center", aspectRatioClasses[aspectRatio], className)}
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
            <div className={cn("relative overflow-hidden w-full", aspectRatioClasses[aspectRatio])} 
                style={{ maxWidth: width ? `${width}px` : undefined }}>
                {/* Blur-up thumbnail */}
                {isLoading && thumbnailUrl && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={thumbnailUrl}
                            alt=""
                            className={cn("w-full h-full object-cover blur-xl scale-110", className)}
                            aria-hidden="true"
                        />
                    </div>
                )}
                
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/30">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
                
                <picture className="w-full h-full block">
                    {sources.map((source, index) => (
                        <source 
                            key={index} 
                            srcSet={priority ? source.srcSet : undefined} 
                            data-srcset={!priority ? source.srcSet : undefined}
                            media={source.media} 
                            type={source.type} 
                        />
                    ))}
                    <img
                        ref={imgRef}
                        src={priority ? imageUrl : undefined}
                        data-src={!priority ? imageUrl : undefined}
                        alt={alt}
                        className={cn("object-cover w-full h-full transition-opacity duration-500", 
                            isLoading ? "opacity-0" : "opacity-100",
                            className
                        )}
                        loading={priority ? "eager" : "lazy"}
                        width={width}
                        height={height}
                        decoding={priority ? "sync" : "async"}
                        onLoad={handleImageLoad}
                    />
                </picture>
            </div>
        );
    }

    // Fallback to regular img tag
    return (
        <div className={cn("relative overflow-hidden w-full", aspectRatioClasses[aspectRatio])}
            style={{ maxWidth: width ? `${width}px` : undefined }}>
            {/* Blur-up thumbnail */}
            {isLoading && thumbnailUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={thumbnailUrl}
                        alt=""
                        className={cn("w-full h-full object-cover blur-xl scale-110", className)}
                        aria-hidden="true"
                    />
                </div>
            )}
            
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/30">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
            
            <img
                ref={imgRef}
                src={priority ? imageUrl : undefined}
                data-src={!priority ? imageUrl : undefined}
                alt={alt}
                className={cn("object-cover w-full h-full transition-opacity duration-500",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                loading={priority ? "eager" : "lazy"}
                width={width}
                height={height}
                decoding={priority ? "sync" : "async"}
                onLoad={handleImageLoad}
            />
        </div>
    );
}); 