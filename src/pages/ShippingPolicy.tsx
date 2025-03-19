import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertCircle, Package, Truck } from "lucide-react";

const ShippingPolicy = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Shipping Policy</h1>

      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-4 mb-8">
          <Package className="h-12 w-12 text-primary" />
          <Truck className="h-12 w-12 text-primary" />
        </div>
        
        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Last Updated</AlertTitle>
          <AlertDescription>
            June 15, 2023
          </AlertDescription>
        </Alert>

        <Card className="p-6 space-y-6">
          <div>
            <p className="mb-4">
              For international buyers, orders are shipped and delivered through registered international 
              courier companies and/or International speed post only.
            </p>
            
            <p className="mb-4">
              For domestic buyers, orders are shipped through registered domestic courier companies and/or 
              speed post only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Delivery Timeframes</h2>
            <p className="mb-4">
              Orders are shipped within 3-5 days or as per the delivery date agreed at the time of order 
              confirmation. The actual delivery of the shipment is subject to courier company/post office norms.
            </p>
            <p>
              Konipai is not liable for any delay in delivery by the courier company/postal authorities and 
              only guarantees to hand over the consignment to the courier company or postal authorities within 
              3-5 days from the date of the order and payment or as per the delivery date agreed at the time 
              of order confirmation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Delivery Address</h2>
            <p>
              Delivery of all orders will be to the address provided by the buyer. Delivery of our services 
              will be confirmed on your email ID as specified during registration.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Shipping Costs</h2>
            <p>
              Shipping costs are calculated during checkout based on weight, dimensions, and destination of 
              the items in your order. Payment for shipping will be collected with the purchase.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Razorpay Processing</h2>
            <p>
              Orders processed through Razorpay are securely handled, and shipping information is managed 
              in accordance with our Privacy Policy.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p>
              For any issues regarding shipping or delivery of your order, you may contact our helpdesk at 
              +91 9363020252 or email us at contact@konipai.in.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShippingPolicy; 