import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HomeHeroProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  overlayColor?: string;
  textColor?: string;
}

export function HomeHero({
  title = "Stylish Tote Bags for Every Occasion",
  subtitle = "Handcrafted with premium materials for durability and style",
  buttonText = "Shop Now",
  buttonLink = "/shop",
  backgroundImage = "/images/hero-bg.jpg",
  overlayColor = "rgba(0, 0, 0, 0.4)",
  textColor = "text-white"
}: HomeHeroProps) {
  return (
    <div 
      className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: overlayColor }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${textColor}`}>
          {title}
        </h1>
        <p className={`text-lg md:text-xl mb-8 ${textColor}`}>
          {subtitle}
        </p>
        <Button asChild size="lg">
          <Link to={buttonLink}>{buttonText}</Link>
        </Button>
      </div>
    </div>
  );
}
