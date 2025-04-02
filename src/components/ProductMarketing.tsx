import { useState, useEffect } from 'react';
import { Shield, Truck, Clock, ArrowRight, Users, Star, BadgeCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductMarketingProps {
  productId: string;
  price: number;
  stock?: number;
  viewCount?: number;
  purchaseCount?: number;
}

export function ProductMarketing({ 
  productId, 
  price, 
  stock = 10,
  viewCount = 0,
  purchaseCount = 0 
}: ProductMarketingProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [activeViewers, setActiveViewers] = useState(0);
  
  // Simulate real-time viewers
  useEffect(() => {
    const baseViewers = Math.floor(Math.random() * 5) + 3;
    setActiveViewers(baseViewers);
    
    const interval = setInterval(() => {
      const change = Math.random() > 0.5 ? 1 : -1;
      setActiveViewers(prev => Math.max(2, Math.min(15, prev + change)));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Countdown timer for urgency
  useEffect(() => {
    const endTime = new Date();
    endTime.setHours(23, 59, 59);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Trust Badges */}
      <div className="flex items-center justify-between gap-4 text-sm border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span>Free Shipping</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>24/7 Support</span>
        </div>
      </div>

      {/* Social Proof */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{activeViewers} people are viewing this product</span>
        </div>
        {purchaseCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="h-4 w-4" />
            <span>{purchaseCount} people purchased this recently</span>
          </div>
        )}
      </div>

      {/* Urgency Elements */}
      <div className="space-y-3">
        {stock <= 10 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              Only {stock} left in stock
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Sale ends in {timeLeft}
          </Badge>
        </div>
      </div>

      {/* Special Offers */}
      <div className="bg-primary/5 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">Special Offers</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            <span>Free shipping on orders above ₹999</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            <span>Get 10% off on your first purchase</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            <span>Buy 2 get 1 free on accessories</span>
          </div>
        </div>
      </div>

      {/* Trust Reviews Summary */}
      <div className="flex items-center justify-between border-t border-b py-4">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-4 w-4 fill-primary text-primary" />
            ))}
          </div>
          <span className="text-sm font-medium">4.8/5</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="cursor-help">
                Trusted Shop
                <BadgeCheck className="h-3 w-3 ml-1 text-primary" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verified by Trusted Shops</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Payment Options */}
      <div className="space-y-3">
        <span className="text-sm text-muted-foreground">Secure payment methods:</span>
        <div className="grid grid-cols-3 gap-2">
          <div className="border rounded p-2 text-center text-sm">Credit Card</div>
          <div className="border rounded p-2 text-center text-sm">UPI</div>
          <div className="border rounded p-2 text-center text-sm">Net Banking</div>
        </div>
      </div>
    </div>
  );
} 