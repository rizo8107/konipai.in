import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CouponSectionProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: () => void;
  removeCoupon: () => void;
  couponLoading: boolean;
  couponError: string | null;
  hasAppliedCoupon: boolean;
}

export function CouponSection({
  couponCode,
  setCouponCode,
  applyCoupon,
  removeCoupon,
  couponLoading,
  couponError,
  hasAppliedCoupon
}: CouponSectionProps) {
  return (
    <div className="space-y-3 mt-6">
      <h2 className="text-lg font-semibold">Coupon Code</h2>
      <div className="flex items-center space-x-3">
        <Input
          id="couponCode"
          name="couponCode"
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Enter coupon code"
          disabled={hasAppliedCoupon || couponLoading}
          className="flex-1"
        />
        
        {couponLoading ? (
          <Button disabled className="w-24">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Applying...
          </Button>
        ) : hasAppliedCoupon ? (
          <Button type="button" onClick={removeCoupon} variant="destructive" className="w-24">
            Remove
          </Button>
        ) : (
          <Button type="button" onClick={applyCoupon} className="w-24">
            Apply
          </Button>
        )}
      </div>
      
      {couponError && (
        <p className="text-red-600 text-sm mt-1">{couponError}</p>
      )}
      
      {hasAppliedCoupon && !couponError && (
        <p className="text-green-600 text-sm mt-1">Coupon applied successfully!</p>
      )}
    </div>
  );
}
