import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertCircle, ShieldCheck } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
      
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-center mb-8">
          <ShieldCheck className="h-16 w-16 text-primary" />
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
              This privacy policy sets out how Konipai uses and protects any information that you give us when you visit our 
              website and/or agree to purchase from us. We are committed to ensuring that your privacy is protected.
            </p>
            
            <p className="mb-4">
              Should we ask you to provide certain information by which you can be identified when using this website, 
              you can be assured that it will only be used in accordance with this privacy statement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Information We Collect</h2>
            <p className="mb-3">We may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name</li>
              <li>Contact information including email address and phone number</li>
              <li>Demographic information such as address, postal code, and preferences</li>
              <li>Other information relevant to customer surveys and/or offers</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">How We Use Your Information</h2>
            <p className="mb-3">We require this information to understand your needs and provide you with better service, specifically for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Internal record keeping</li>
              <li>Improving our products and services</li>
              <li>Sending promotional emails about new products, special offers, or other information we think you may find interesting</li>
              <li>Contacting you for market research purposes</li>
              <li>Customizing the website according to your interests</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Security</h2>
            <p>
              We are committed to ensuring that your information is secure. We have implemented suitable physical, 
              electronic, and managerial procedures to safeguard and secure the information we collect online.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">How We Use Cookies</h2>
            <p className="mb-4">
              A cookie is a small file that asks permission to be placed on your computer's hard drive. 
              We use traffic log cookies to identify which pages are being used and to improve our website.
              We only use this information for statistical analysis and then remove the data from the system.
            </p>
            
            <p>
              You can choose to accept or decline cookies. Most web browsers automatically accept cookies, 
              but you can usually modify your browser settings to decline cookies if you prefer. This may 
              prevent you from taking full advantage of the website.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Controlling Your Personal Information</h2>
            <p className="mb-3">You may choose to restrict the collection or use of your personal information in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Look for opt-out options when filling forms on our website
              </li>
              <li>
                Email us at contact@konipai.in if you previously agreed to us using your personal information for direct marketing
              </li>
            </ul>
            
            <p className="mt-4">
              We will not sell, distribute, or lease your personal information to third parties unless we have 
              your permission or are required by law to do so.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Payment Information</h2>
            <p>
              For transactions processed through Razorpay, please note that your payment information is handled 
              securely by Razorpay's payment gateway. We do not store your credit card details or other payment 
              method information on our servers.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p>
              If you believe that any information we hold about you is incorrect or incomplete, please email us 
              at contact@konipai.in as soon as possible. We will promptly correct any information found to be incorrect.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 