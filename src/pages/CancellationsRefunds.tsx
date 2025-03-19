import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const CancellationsRefunds = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Cancellations and Refunds Policy</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
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
              Konipai believes in helping its customers as far as possible, and has therefore a liberal cancellation policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Cancellation Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Cancellations will be considered only if the request is made within 6-8 days of placing the order.
              </li>
              <li>
                However, the cancellation request may not be entertained if the orders have been communicated to 
                the vendors/merchants and they have initiated the process of shipping them.
              </li>
              <li>
                Konipai does not accept cancellation requests for perishable items like flowers, eatables etc. 
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                If you receive damaged or defective items, please report it to our Customer Service team within 
                6-8 days of receipt of the products.
              </li>
              <li>
                The request will be entertained once the merchant has checked and determined the same at his own end.
              </li>
              <li>
                In case you feel that the product received is not as shown on the site or as per your expectations, 
                you must bring it to the notice of our customer service within 6-8 days of receiving the product.
              </li>
              <li>
                The Customer Service Team after looking into your complaint will take an appropriate decision.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Warranty Claims</h2>
            <p>
              In case of complaints regarding products that come with a warranty from manufacturers, please refer 
              the issue to them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Processing Time</h2>
            <p>
              In case of any Refunds approved by Konipai, it'll take 3-5 days for the refund to be processed to 
              the end customer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Razorpay Refunds</h2>
            <p>
              For payments processed through Razorpay, refunds will be credited back to the original payment 
              method used for the purchase. The timing of the refund may vary depending on your payment provider.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p>
              If you have any questions about our cancellations and refunds policy, please contact our customer 
              service team at contact@konipai.in or call +91 9363020252.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CancellationsRefunds; 