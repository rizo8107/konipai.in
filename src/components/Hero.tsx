import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#219898]/5 border-b border-[#219898]/10">
      <div className="absolute inset-0 bg-grid-[#219898]/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
        <div className="konipai-container flex flex-col justify-center py-12 lg:py-20 relative">
          <Badge className="mb-6 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20 w-fit">
            Eco-friendly & Stylish
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Sustainable Totes<br />
            <span className="text-[#219898]">for Modern Living</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-gray-600 max-w-lg">
            Beautifully crafted canvas tote bags designed for everyday use. 
            Made with 100% organic materials and sustainable practices.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              asChild
              className="bg-[#219898] hover:bg-[#219898]/90 text-white"
              size="lg"
            >
              <Link to="/shop">
                Shop Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              size="lg"
              className="border-[#219898] text-[#219898] hover:bg-[#219898]/5"
            >
              <Link to="/about">
                Learn More
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div>
              <p className="text-2xl font-bold text-[#219898]">100%</p>
              <p className="text-sm text-gray-600">Organic Materials</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#219898]">5,000+</p>
              <p className="text-sm text-gray-600">Happy Customers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#219898]">4.9/5</p>
              <p className="text-sm text-gray-600">Customer Rating</p>
            </div>
          </div>
        </div>
        
        <div className="relative h-full min-h-[400px] lg:min-h-[700px]">
          <div className="absolute inset-0 bg-[#219898]/10 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent" />
          <img 
            src="/product-images/create-a-mockup-of-white-tote-bag-a-girl-wearing-i.png" 
            alt="Model wearing Konipai tote bag"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute -bottom-1 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
