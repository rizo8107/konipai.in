import { Check } from 'lucide-react';

interface PaymentSectionProps {
  isLiveMode: boolean;
}

export function PaymentSection({ isLiveMode }: PaymentSectionProps) {
  return (
    <div className="mt-6 space-y-3">
      <h2 className="text-lg font-semibold">Payment Method</h2>
      
      <div className="bg-white border rounded-md p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 flex-shrink-0">
            <img 
              src="/razorpay-logo.svg" 
              alt="Razorpay" 
              className="h-full w-full object-contain"
              onError={(e) => (e.currentTarget.src = 'https://razorpay.com/assets/razorpay-logo.svg')} 
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-1" />
              <span className="font-medium">Secure payment via Razorpay</span>
            </div>
            
            <p className="text-sm text-gray-500">
              Pay securely using credit/debit card, UPI, or other payment methods
            </p>
            
            {isLiveMode && (
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                <p className="text-xs text-green-600 font-medium">Live payments enabled</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        Your payment information is processed securely. We do not store your card details.
      </p>
    </div>
  );
}
