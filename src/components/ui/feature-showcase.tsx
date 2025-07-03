import { cn } from "@/lib/utils";

interface FeatureShowcaseProps {
  title: string;
  description: string;
  imageUrl?: string;
  iconName?: string;
  layout?: 'left' | 'right';
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export function FeatureShowcase({
  title,
  description,
  imageUrl,
  iconName,
  layout = 'left',
  bgColor = 'bg-background',
  textColor = 'text-foreground',
  className,
}: FeatureShowcaseProps) {
  // Dynamically import icon if provided
  const IconComponent = iconName ? 
    require('lucide-react')[iconName] : 
    null;

  return (
    <div className={cn(
      "rounded-xl overflow-hidden shadow-md",
      bgColor,
      textColor,
      className
    )}>
      <div className={cn(
        "flex flex-col md:flex-row items-center",
        layout === 'right' && "md:flex-row-reverse"
      )}>
        {/* Image or Icon Section */}
        {imageUrl ? (
          <div className="w-full md:w-1/2">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover aspect-video md:aspect-square"
            />
          </div>
        ) : IconComponent ? (
          <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
            <IconComponent className="w-24 h-24" />
          </div>
        ) : null}

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-4">{title}</h3>
          <p className="opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}
