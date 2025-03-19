import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Terms and Conditions</h1>
      
      <div className="max-w-3xl mx-auto mb-8">
        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            Last updated: June 15, 2023
          </AlertDescription>
        </Alert>

        <Card className="p-6 space-y-6">
          <div>
            <p className="mb-4">
              For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean 
              Konipai, whose registered/operational office is Vignarajapuram 1st Main Road Santhosapuram Kanchipuram TAMIL NADU 600073.
            </p>
            
            <p className="mb-4">
              "You", "your", "user", "visitor" shall mean any natural or legal person who is visiting our website and/or 
              agreed to purchase from us.
            </p>
            
            <p className="mb-4">
              Your use of the website and/or purchase from us are governed by the following Terms and Conditions:
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Website Content and Usage</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                The content of the pages of this website is subject to change without notice.
              </li>
              <li>
                Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, 
                performance, completeness, or suitability of the information and materials found or offered on this 
                website for any particular purpose.
              </li>
              <li>
                You acknowledge that such information and materials may contain inaccuracies or errors and we 
                expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
              </li>
              <li>
                Your use of any information or materials on our website and/or product pages is entirely at your own risk, 
                for which we shall not be liable. It shall be your own responsibility to ensure that any products, services, 
                or information available through our website and/or product pages meet your specific requirements.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Intellectual Property</h2>
            <p className="mb-4">
              Our website contains material which is owned by or licensed to us. This material includes, but is not limited to, 
              the design, layout, look, appearance, and graphics. Reproduction is prohibited other than in accordance with the 
              copyright notice, which forms part of these terms and conditions.
            </p>
            <p>
              All trademarks reproduced in our website which are not the property of, or licensed to, the operator are 
              acknowledged on the website. Unauthorized use of information provided by us shall give rise to a claim for 
              damages and/or be a criminal offense.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">External Links</h2>
            <p className="mb-4">
              From time to time, our website may also include links to other websites. These links are provided for your 
              convenience to provide further information. They do not signify that we endorse the website(s).
            </p>
            <p>
              You may not create a link to our website from another website or document without Konipai's prior written consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Payments and Transactions</h2>
            <p>
              We shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly 
              out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the 
              preset limit mutually agreed by us with our acquiring bank from time to time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Razorpay Payment Processing</h2>
            <p>
              For transactions processed through Razorpay, additional terms of service from Razorpay may apply. 
              All payment information is securely handled through Razorpay's payment gateway.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Dispute Resolution</h2>
            <p>
              Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us 
              is subject to the laws of India.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p>
              By using our website and services, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms and Conditions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions; 