import { useState, useEffect } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Collections } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';

interface ProductImageProps {
    url: string;
    alt: string;
    className?: string;
}

export function ProductImage({ url, alt, className }: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setError('No image URL provided');
            setIsLoading(false);
            return;
        }

        const loadImage = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Split the URL into record ID and filename
                const [recordId, filename] = url.split('/');
                if (!recordId || !filename) {
                    throw new Error('Invalid image URL format');
                }

                // Get the file URL from PocketBase
                const baseUrl = 'https://backend-pocketbase.7za6uc.easypanel.host';
                const fileUrl = `${baseUrl}/api/files/${Collections.PRODUCTS}/${recordId}/${filename}`;
                setImageUrl(fileUrl);
                setIsLoading(false);
            } catch (err) {
                console.error('Error loading image:', err);
                setError('Failed to load image');
                setIsLoading(false);
            }
        };

        loadImage();
    }, [url]);

    if (isLoading) {
        return (
            <div className={cn("animate-pulse bg-muted", className)}>
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className={cn("bg-muted flex items-center justify-center", className)}>
                <ImageIcon className="h-6 w-6 text-muted-foreground" aria-label="Image failed to load" />
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={cn("object-cover", className)}
            loading="lazy"
        />
    );
} 