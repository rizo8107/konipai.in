import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Terms and Conditions</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg mb-6">
          Welcome to Konipai. These Terms and Conditions govern your use of our website 
          konipai.in (the "Site") and your relationship with Konipai Tote Bag Hub ("we", "us", or "our"). 
          Please read these terms carefully as they affect your rights and liabilities under the law.
        </p>
        <p className="text-lg mb-6">
          By using our Site, you agree to be bound by these Terms and Conditions. If you do not agree 
          to these Terms and Conditions, please do not use our Site.
        </p>

        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            Last updated: June 15, 2023
          </AlertDescription>
        </Alert>
      </div>

      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="use" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="use">Use of Site</TabsTrigger>
            <TabsTrigger value="orders">Orders & Payments</TabsTrigger>
            <TabsTrigger value="legal">Legal Provisions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="use" className="mt-6">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-bold mb-4">1. Use of Site</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">1.1 Account Registration</h3>
                      <p>
                        To make a purchase on our Site, you may need to register for an account. You agree to provide accurate, 
                        current, and complete information during the registration process and to update such information to keep 
                        it accurate, current, and complete. We reserve the right to suspend or terminate your account if any 
                        information provided during the registration process or thereafter proves to be inaccurate, not current, 
                        or incomplete.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">1.2 Account Security</h3>
                      <p>
                        You are responsible for maintaining the confidentiality of your account and password and for restricting 
                        access to your computer. You agree to accept responsibility for all activities that occur under your account 
                        or password. We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel 
                        orders at our sole discretion.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">1.3 Acceptable Use</h3>
                      <p>
                        You agree to use our Site only for lawful purposes and in a way that does not infringe the rights of, restrict, 
                        or inhibit anyone else's use and enjoyment of the Site. Prohibited behavior includes harassing or causing 
                        distress or inconvenience to any person, transmitting obscene or offensive content, or disrupting the normal 
                        flow of dialogue within our Site.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">1.4 Intellectual Property</h3>
                      <p>
                        All content included on this Site, such as text, graphics, logos, button icons, images, audio clips, digital 
                        downloads, data compilations, and software, is the property of Konipai or its content suppliers and protected 
                        by international copyright laws. The compilation of all content on this Site is the exclusive property of 
                        Konipai and protected by international copyright laws.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">1.5 Third-Party Links</h3>
                      <p>
                        Our Site may contain links to third-party websites that are not owned or controlled by Konipai. We have no 
                        control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party 
                        websites. By using our Site, you expressly relieve Konipai from any and all liability arising from your use 
                        of any third-party website.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-6">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-bold mb-4">2. Orders & Payments</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.1 Product Information</h3>
                      <p>
                        While we strive to provide accurate product information, it is possible that descriptions of products, 
                        pricing, and availability may contain errors. We reserve the right to correct any errors, inaccuracies, 
                        or omissions and to change or update information at any time without prior notice.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.2 Ordering & Acceptance</h3>
                      <p>
                        When you place an order on our Site, you are making an offer to purchase. We may acknowledge your order by email, 
                        but this acknowledgment does not constitute our acceptance of your offer to purchase. We reserve the right to 
                        accept or reject your offer for any reason, including but not limited to unavailability of product, error in 
                        pricing or product description, or error in your order.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.3 Payment</h3>
                      <p>
                        We accept various payment methods as specified on our Site. By providing a payment method, you represent 
                        and warrant that you are authorized to use the designated payment method and that you authorize us to charge 
                        your payment method for the total amount of your order (including any taxes and shipping charges). If your 
                        payment method cannot be verified, is invalid, or is not otherwise acceptable, your order may be suspended or 
                        cancelled.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.4 Pricing & Tax</h3>
                      <p>
                        All prices are shown in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated. 
                        Shipping charges are additional and will be added to the total amount of your order based on the shipping 
                        method selected. For international orders, customers are responsible for any customs duties, taxes, or 
                        other fees imposed by the destination country.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.5 Order Tracking & Delivery</h3>
                      <p>
                        Once your order is placed, you will receive an order confirmation email. When your order is shipped, you 
                        will receive a shipping confirmation email with tracking information. We are not responsible for any delays 
                        in delivery due to unforeseen circumstances or events beyond our control.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="legal" className="mt-6">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-bold mb-4">3. Legal Provisions</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.1 Disclaimer of Warranties</h3>
                      <p>
                        Our site is provided on an "as is" and "as available" basis. To the fullest extent permitted by applicable law, 
                        we disclaim all warranties, express or implied, including but not limited to, implied warranties of merchantability 
                        and fitness for a particular purpose. We do not warrant that our site will be uninterrupted or error-free, that 
                        defects will be corrected, or that our site or the server that makes it available are free of viruses or other 
                        harmful components.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.2 Limitation of Liability</h3>
                      <p>
                        To the fullest extent permitted by applicable law, Konipai shall not be liable for any indirect, incidental, 
                        special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or 
                        indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your use or 
                        inability to use our site; (b) any unauthorized access to or use of our servers and/or any personal information 
                        stored therein; (c) any interruption or cessation of transmission to or from our site; or (d) any bugs, viruses, 
                        trojan horses, or the like that may be transmitted to or through our site.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.3 Indemnification</h3>
                      <p>
                        You agree to defend, indemnify, and hold harmless Konipai, its officers, directors, employees, and agents, 
                        from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses 
                        (including but not limited to attorney's fees) arising from: (a) your use of and access to our site; (b) your 
                        violation of any term of these Terms and Conditions; or (c) your violation of any third party right, including 
                        without limitation any copyright, property, or privacy right.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.4 Governing Law</h3>
                      <p>
                        These Terms and Conditions shall be governed by and construed in accordance with the laws of India, without 
                        regard to its conflict of law provisions. You agree to submit to the personal jurisdiction of the courts 
                        located in Mumbai, India for the resolution of any disputes arising out of or relating to these Terms and 
                        Conditions or your use of our Site.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.5 Changes to Terms and Conditions</h3>
                      <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is 
                        material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a 
                        material change will be determined at our sole discretion. By continuing to access or use our site after any 
                        revisions become effective, you agree to be bound by the revised terms.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.6 Severability</h3>
                      <p>
                        If any provision of these Terms is found to be unenforceable or invalid under any applicable law, such 
                        unenforceability or invalidity shall not render these Terms unenforceable or invalid as a whole, and such 
                        provisions shall be deleted without affecting the remaining provisions herein.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="p-4 border rounded-md bg-muted">
          <p className="mb-4">
            By using our Site, you acknowledge that you have read, understood, and agree to be bound by these 
            Terms and Conditions. If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <address className="not-italic">
            <p>Konipai Tote Bag Hub</p>
            <p>123 Tote Lane, Mumbai, India 400001</p>
            <p>Email: <a href="mailto:legal@konipai.in" className="text-primary hover:underline">legal@konipai.in</a></p>
            <p>Phone: +91 (123) 456-7890</p>
          </address>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 