import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Lock, ShieldCheck } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-center mb-8">
          <ShieldCheck className="h-16 w-16 text-primary" />
        </div>
        
        <p className="text-lg mb-6">
          At Konipai, we value your privacy and are committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you visit our website or make a purchase from us.
        </p>
        
        <p className="text-lg mb-6">
          By using our website and services, you consent to the data practices described in this policy.
          Please read this policy carefully to understand our practices regarding your personal data.
        </p>

        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Last Updated</AlertTitle>
          <AlertDescription>
            June 15, 2023
          </AlertDescription>
        </Alert>
      </div>

      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="collection" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="collection">Data Collection</TabsTrigger>
            <TabsTrigger value="usage">Data Usage</TabsTrigger>
            <TabsTrigger value="sharing">Data Sharing</TabsTrigger>
            <TabsTrigger value="rights">Your Rights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="collection" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">Information We Collect</h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 p-2 rounded-full mr-2">
                    <Lock className="h-5 w-5 text-primary" />
                  </span>
                  Personal Information
                </h3>
                <p className="mb-3">
                  We collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Register for an account</li>
                  <li>Place an order on our website</li>
                  <li>Sign up for our newsletter</li>
                  <li>Contact our customer service</li>
                  <li>Participate in promotions or surveys</li>
                </ul>
                <p className="mt-3">
                  This personal information may include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Billing and shipping address</li>
                  <li>Payment information (we do not store complete credit card information)</li>
                  <li>Account login credentials</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Automatically Collected Information</h3>
                <p className="mb-3">
                  When you visit our website, our servers automatically record information that your browser sends.
                  This data may include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Referring website</li>
                  <li>Time and date of access</li>
                  <li>Pages you view</li>
                  <li>Links you click</li>
                  <li>Search terms you enter</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Cookies and Similar Technologies</h3>
                <p className="mb-3">
                  We use cookies and similar tracking technologies to collect information about your browsing activities
                  and to improve your experience on our site. Cookies are small data files that are placed on your device
                  when you visit a website.
                </p>
                <p>
                  We use both session cookies (which expire once you close your web browser) and persistent cookies
                  (which stay on your device until you delete them). You can control the use of cookies at the individual
                  browser level, but disabling cookies may limit your use of certain features on our website.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="usage" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">How We Use Your Information</h2>
            
            <div className="space-y-6 mb-8">
              <p>
                We use the information we collect for various purposes, including to:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Process Transactions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We use your information to process and fulfill your orders, including processing payments,
                    arranging shipping, and sending order confirmations.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Customer Service</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We use your information to provide customer support, respond to inquiries, and address
                    any issues or concerns you may have about our products or services.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Marketing and Communications</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    With your consent, we may send promotional emails about new products, special offers,
                    or other information we think you may find interesting.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Improve Our Website</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We analyze usage data to improve our website's functionality, design, and user experience,
                    and to develop new products and services.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Security and Fraud Prevention</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We use your information to protect our website, products, services, and customers from
                    fraudulent, unauthorized, or illegal activities.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Legal Compliance</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We may use your information to comply with applicable laws, regulations, legal processes,
                    or enforceable governmental requests.
                  </p>
                </div>
              </div>
              
              <p>
                We will retain your personal information only for as long as necessary to fulfill the purposes
                outlined in this Privacy Policy, and as required by law.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="sharing" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">How We Share Your Information</h2>
            
            <div className="space-y-6 mb-8">
              <p>
                We may share your personal information with third parties in the following circumstances:
              </p>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Service Providers</h3>
                <p>
                  We may share your information with third-party service providers who perform services on our behalf,
                  such as payment processing, order fulfillment, shipping, customer service, web hosting, data analysis,
                  email delivery, and marketing assistance.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Business Transfers</h3>
                <p>
                  If Konipai is involved in a merger, acquisition, sale of assets, or bankruptcy, your personal information
                  may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on
                  our website of any change in ownership or uses of your personal information.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Legal Requirements</h3>
                <p>
                  We may disclose your information if required to do so by law or in response to valid requests by public
                  authorities (e.g., a court or a government agency). We may also disclose your information to enforce our
                  Terms and Conditions, protect our rights, privacy, safety, or property, and to detect, prevent, or address
                  fraud or security issues.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">With Your Consent</h3>
                <p>
                  We may share your information with third parties when we have your consent to do so.
                </p>
              </div>
              
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Data Security</h3>
                <p className="mb-3">
                  We implement appropriate technical and organizational security measures to protect your personal
                  information from unauthorized access, disclosure, alteration, or destruction. However, no method
                  of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee
                  absolute security.
                </p>
                <p>
                  In the event of a data breach that affects your personal information, we will notify you as required
                  by applicable law.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="rights" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">Your Rights and Choices</h2>
            
            <div className="space-y-6 mb-8">
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Right to Access</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      You have the right to request information about the personal data we hold about you and to receive
                      a copy of that data. You can access much of this information by logging into your account.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Right to Rectification</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      You have the right to request the correction of inaccurate or incomplete personal information
                      we hold about you. You can update most of your personal information directly through your account settings.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>Right to Erasure</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      In certain circumstances, you have the right to request the deletion of your personal data.
                      Please note that we may need to retain certain information for legal or administrative purposes,
                      such as record keeping, maintenance of opt-out preferences, or prevention of fraud.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Right to Restrict Processing</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      You have the right to request that we restrict the processing of your personal information
                      in certain circumstances, such as when you contest the accuracy of the data.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>Right to Object to Processing</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      You have the right to object to the processing of your personal data for direct marketing purposes
                      or when the processing is based on our legitimate interests.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger>Right to Data Portability</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      You have the right to receive your personal data in a structured, commonly used, and machine-readable format,
                      and to transmit that data to another data controller.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">How to Exercise Your Rights</h3>
                <p className="mb-3">
                  To exercise your rights, please contact us using the information provided in the "Contact Us" section below.
                  We will respond to your request within a reasonable timeframe and in accordance with applicable laws.
                </p>
                <p>
                  We may need to verify your identity before responding to your request. We will not discriminate against
                  you for exercising any of these rights.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Marketing Communications</h3>
                <p>
                  You can opt out of receiving promotional emails from us by following the unsubscribe instructions included
                  in each email or by contacting us directly. Please note that even if you opt out of receiving promotional
                  communications, we may still send you non-promotional communications, such as those related to your account
                  or our ongoing business relations.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">International Data Transfers</h2>
          <p>
            Your personal information may be transferred to, and processed in, countries other than the country in which
            you are resident. These countries may have data protection laws that are different from the laws of your country.
            By using our website and services, you consent to the transfer of your information to countries outside your country
            of residence, including to India and other countries where Konipai operates.
          </p>
          <p>
            We take appropriate measures to ensure that your personal data remains protected in accordance with this Privacy Policy
            when transferred internationally.
          </p>
        </div>
        
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
          <p>
            Our website is not intended for children under the age of 13. We do not knowingly collect personal information from
            children under 13. If you are a parent or guardian and believe that your child has provided us with personal information,
            please contact us, and we will delete such information from our systems.
          </p>
        </div>
        
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
            We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated"
            date at the top of this policy. We encourage you to review this Privacy Policy periodically for any changes.
          </p>
        </div>
        
        <div className="p-6 border rounded-md bg-muted">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <div>
            <p className="font-medium">Konipai Tote Bag Hub</p>
            <p>Attn: Privacy Team</p>
            <p>123 Tote Lane, Mumbai, India 400001</p>
            <p>Email: <a href="mailto:privacy@konipai.in" className="text-primary hover:underline">privacy@konipai.in</a></p>
            <p>Phone: +91 (123) 456-7890</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 