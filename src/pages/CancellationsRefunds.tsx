import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertCircle, Building, Phone, Mail, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

        <Card className="p-6 mb-8 bg-gray-50 border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Billing Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Billing Entity</h3>
              <p className="text-gray-700 font-medium">ZentharaStudios</p>
              <p className="text-gray-700">Vignarajapuram 1st Cross Street</p>
              <p className="text-gray-700">Chennai, Tamil Nadu 600073</p>
              <p className="text-gray-700">India</p>
            
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Contact for Refunds</h3>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-gray-500" />
                <p className="text-gray-700">support@konipai.in</p>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-gray-500" />
                <p className="text-gray-700">+91 93630 20252</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <p className="text-gray-700">Corporate Office: Vignarajapuram 1st Cross Street, Chennai, Tamil Nadu 600073, India</p>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-gray-600">
            All refunds will be processed by ZentharaStudios, the official billing entity for all purchases made on this website. 
            For any refund-related inquiries, please use the contact information above and include your order number in all communications.
          </p>
        </Card>

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
              <li>
                All approved refunds will be processed by ZentharaStudios and will be credited back to the original payment method.
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
            <p className="mt-2">
              All transactions will appear as "ZentharaStudios" on your bank statement or payment method statement.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p>
              If you have any questions about our cancellations and refunds policy, please contact our customer 
              service team at refunds@zenthrastudios.com or call +91 1234567890.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CancellationsRefunds; 