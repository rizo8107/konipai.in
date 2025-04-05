import { useState, useEffect, memo, useRef } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Collections } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { getPocketBaseImageUrl, getResponsiveImageSources, ImageSize } from '@/utils/imageOptimizer';

interface SourceProps {
    srcSet: string;
    media: string;
    type: string;
}

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

// Default dimensions based on aspect ratio to prevent layout shifts
const defaultDimensions = {
    square: { width: 400, height: 400 },
    portrait: { width: 400, height: 533 },
    landscape: { width: 400, height: 300 },
};

export const ProductImage = memo(function ProductImage({ 
    url, 
    alt, 
    className,
    priority = false,
    width,
    height,
    size = "medium",
    useResponsive = true,
    aspectRatio = "square"
}: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [sources, setSources] = useState<SourceProps[]>([]);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Define aspect ratio styles
    const aspectRatioStyles = {
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
            // Generate optimized image URLs
            const optimizedUrl = getPocketBaseImageUrl(url, Collections.PRODUCTS, size, "webp");
            const thumbUrl = getPocketBaseImageUrl(url, Collections.PRODUCTS, "thumbnail", "webp");
            
            // If using responsive images, get the sources
            if (useResponsive) {
                setSources(getResponsiveImageSources(url, Collections.PRODUCTS));
            }
            
            setImageUrl(optimizedUrl);
            setThumbnailUrl(thumbUrl);
            
            if (priority) {
                setIsLoading(true);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error loading image:', err);
            setError('Failed to load image');
            setIsLoading(false);
        }
    }, [url, size, priority, useResponsive]);

    // Set up intersection observer for lazy loading
    useEffect(() => {
        if (!priority && imgRef.current && imageUrl) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // Start loading the image
                            setIsLoading(true);
                            const img = entry.target as HTMLImageElement;
                            img.src = imageUrl;
                            observerRef.current?.disconnect();
                        }
                    });
                },
                {
                    // Load images earlier - increase rootMargin
                    rootMargin: '200px',
                    threshold: 0.01
                }
            );

            observerRef.current.observe(imgRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [imageUrl, priority]);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setError('Failed to load image');
        setIsLoading(false);
    };

    if (error || !imageUrl) {
        return (
            <div 
                className={cn(
                    "bg-muted flex items-center justify-center",
                    aspectRatioStyles[aspectRatio],
                    className
                )}
                style={{
                    width: width ? `${width}px` : '100%',
                    height: height ? `${height}px` : 'auto'
                }}
            >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
        );
    }

    // For responsive images, use picture element
    if (useResponsive && sources.length > 0) {
        return (
            <div 
                className={cn(
                    "relative overflow-hidden",
                    aspectRatioStyles[aspectRatio],
                    className
                )}
            >
                {/* Blur-up thumbnail */}
                {isLoading && thumbnailUrl && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover blur-xl scale-110"
                            aria-hidden="true"
                        />
                    </div>
                )}
                
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/30">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
                
                <picture>
                    {sources.map((source, index) => (
                        <source 
                            key={index}
                            srcSet={source.srcSet}
                            media={source.media}
                            type={source.type}
                        />
                    ))}
                    <img
                        ref={imgRef}
                        src={priority ? imageUrl : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"}
                        alt={alt}
                        width={width || defaultDimensions[aspectRatio].width}
                        height={height || defaultDimensions[aspectRatio].height}
                        className={cn(
                            "w-full h-full object-cover transition-opacity duration-500",
                            isLoading ? "opacity-0" : "opacity-100"
                        )}
                        loading={priority ? "eager" : "lazy"}
                        fetchPriority={priority ? "high" : "auto"}
                        decoding={priority ? "sync" : "async"}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                </picture>
            </div>
        );
    }

    // For simple images, use img element
    return (
        <div 
            className={cn(
                "relative overflow-hidden",
                aspectRatioStyles[aspectRatio],
                className
            )}
        >
            {/* Blur-up thumbnail */}
            {isLoading && thumbnailUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover blur-xl scale-110"
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
                src={priority ? imageUrl : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"}
                alt={alt}
                width={width || defaultDimensions[aspectRatio].width}
                height={height || defaultDimensions[aspectRatio].height}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    isLoading ? "opacity-0" : "opacity-100"
                )}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding={priority ? "sync" : "async"}
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
        </div>
    );
}); 