import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Color {
  name: string;
  value: string;
  hex: string;
  inStock: boolean;
}

interface Size {
  name: string;
  value: string;
  inStock: boolean;
}

interface ProductOptionsProps {
  colors?: Color[];
  sizes?: Size[];
  selectedColor?: string;
  selectedSize?: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
}

export function ProductOptions({
  colors = [],
  sizes = [],
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: ProductOptionsProps) {
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Color: <span className="text-muted-foreground">{colors.find(c => c.value === selectedColor)?.name}</span>
            </label>
            {!colors.some(c => c.value === selectedColor) && (
              <Badge variant="outline" className="text-destructive border-destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Select a color
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <TooltipProvider key={color.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                        selectedColor === color.value ? "border-primary scale-110" : "border-transparent hover:scale-105",
                        !color.inStock && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => color.inStock && onColorChange(color.value)}
                      disabled={!color.inStock}
                    >
                      {selectedColor === color.value && (
                        <Check className={cn(
                          "h-4 w-4",
                          isLightColor(color.hex) ? "text-black" : "text-white"
                        )} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{color.name}{!color.inStock && " (Out of Stock)"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Size: <span className="text-muted-foreground">{sizes.find(s => s.value === selectedSize)?.name}</span>
            </label>
            <div className="flex items-center gap-4">
              {!sizes.some(s => s.value === selectedSize) && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Select a size
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowSizeGuide(true)}
              >
                Size Guide
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sizes.map((size) => (
              <TooltipProvider key={size.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "py-2 px-4 rounded-md border text-sm font-medium transition-all",
                        selectedSize === size.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:bg-accent",
                        !size.inStock && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => size.inStock && onSizeChange(size.value)}
                      disabled={!size.inStock}
                    >
                      {size.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{size.name}{!size.inStock && " (Out of Stock)"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine if a color is light or dark
function isLightColor(hex: string): boolean {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 128;
} 