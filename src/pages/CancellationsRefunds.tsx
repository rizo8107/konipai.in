import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Clock, RotateCcw } from "lucide-react";

const CancellationsRefunds = () => {
  const refundTimeline = [
    {
      title: "Request Initiated",
      description: "Submit your return/refund request through your account or by contacting customer service."
    },
    {
      title: "Request Approved",
      description: "Our team reviews your request within 24-48 hours and sends approval with return instructions."
    },
    {
      title: "Return Shipping",
      description: "Ship the item back to us using the provided return label or your preferred carrier."
    },
    {
      title: "Product Inspection",
      description: "Our team verifies the returned product's condition (usually takes 1-2 business days)."
    },
    {
      title: "Refund Processed",
      description: "Once approved, your refund will be processed to your original payment method."
    },
    {
      title: "Refund Completion",
      description: "Refund appears in your account (timing depends on your payment provider, typically 5-7 business days)."
    }
  ];

  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Cancellations and Refunds Policy</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg mb-6">
          At Konipai, we want you to be completely satisfied with your purchase. We understand that 
          sometimes you may need to cancel an order or return a product. This policy outlines our 
          guidelines for cancellations, returns, and refunds.
        </p>

        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Last Updated</AlertTitle>
          <AlertDescription>
            June 15, 2023
          </AlertDescription>
        </Alert>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Order Cancellations</h2>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="text-xl font-medium mb-4">Cancellation Window</h3>
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="mb-2">
                  You can cancel your order within <strong>24 hours</strong> of placing it or before it enters the 
                  "Processing" status, whichever comes first.
                </p>
                <p>
                  Once an order moves to "Processing" status, cancellation is not guaranteed as we may have 
                  already started preparing your items for shipment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h3 className="text-xl font-bold mb-4">How to Cancel an Order</h3>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">Log into your Konipai account</p>
              <p className="text-muted-foreground">Access your account dashboard to view your orders.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">Navigate to "Order History"</p>
              <p className="text-muted-foreground">Find the order you wish to cancel.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Select "Request Cancellation"</p>
              <p className="text-muted-foreground">This option will only be available for eligible orders.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </div>
            <div>
              <p className="font-medium">Alternative: Contact Customer Service</p>
              <p className="text-muted-foreground">
                If you cannot cancel through your account, please contact our customer service immediately at 
                <a href="mailto:support@konipai.in" className="text-primary hover:underline ml-1">support@konipai.in</a> 
                or call +91 (123) 456-7890.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Returns Policy</h2>
        
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Return Eligibility</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <RotateCcw className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="font-medium mb-2">30-Day Return Window</p>
                <p>
                  We accept returns within 30 days of delivery. To be eligible for a return, your item must be 
                  in its original condition with all tags attached and in the original packaging.
                </p>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-lg font-medium mb-3">Items Not Eligible for Return</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Personalized or custom-made tote bags</li>
                  <li>Items marked as "Final Sale" or "Non-Returnable"</li>
                  <li>Products without original tags or packaging</li>
                  <li>Used, damaged, or soiled items (unless received in this condition)</li>
                  <li>Items returned after the 30-day return period</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Refunds Process</h2>
        
        <div className="relative mb-8">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted-foreground/20"></div>
          <div className="space-y-8 relative">
            {refundTimeline.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="relative z-10 bg-background w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary flex-shrink-0">
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-medium mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Refund Methods</h3>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Payment Method</th>
                <th className="py-2 text-left">Refund Method</th>
                <th className="py-2 text-left">Processing Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Credit/Debit Card</td>
                <td className="py-2">Original payment method</td>
                <td className="py-2">5-7 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Net Banking</td>
                <td className="py-2">Original payment method</td>
                <td className="py-2">5-7 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">UPI</td>
                <td className="py-2">Original UPI ID</td>
                <td className="py-2">1-3 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Cash on Delivery</td>
                <td className="py-2">Bank transfer or store credit</td>
                <td className="py-2">7-10 business days</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Return Shipping</h3>
          
          <div className="space-y-4">
            <p>
              <strong>Return Shipping Costs:</strong> For standard returns, the customer is responsible for return
              shipping costs. We recommend using a trackable shipping service as we cannot be responsible for 
              items lost in transit.
            </p>
            
            <p>
              <strong>Free Return Shipping:</strong> Return shipping is free for the following cases:
            </p>
            
            <ul className="list-disc pl-5 space-y-1">
              <li>Defective or damaged items received</li>
              <li>Incorrect items shipped</li>
              <li>Missing items from your order</li>
            </ul>
            
            <p>
              <strong>Return Address:</strong>
            </p>
            
            <address className="not-italic pl-5 border-l-2 border-muted-foreground/20">
              Konipai Returns Department<br />
              123 Tote Lane<br />
              Mumbai, India 400001
            </address>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Exchange Policy</h2>
        
        <p className="mb-4">
          We currently do not offer direct exchanges. If you need a different size, color, or product,
          please return your item for a refund and place a new order for the desired item.
        </p>
        
        <Separator className="my-8" />
        
        <div className="p-4 border rounded-md bg-muted">
          <h3 className="font-medium mb-2">Contact Our Returns Department</h3>
          <p className="mb-2">
            If you have any questions about our cancellations and refunds policy, please contact our 
            returns department:
          </p>
          <p>
            Email: <a href="mailto:returns@konipai.in" className="text-primary hover:underline">returns@konipai.in</a><br />
            Phone: +91 (123) 456-7890<br />
            Hours: Monday - Friday, 9:00 AM - 5:00 PM IST
          </p>
        </div>
      </div>
    </div>
  );
};

export default CancellationsRefunds; 