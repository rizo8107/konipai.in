import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Package, Truck } from "lucide-react";

const ShippingPolicy = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Shipping Policy</h1>

      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg mb-6">
          At Konipai, we strive to deliver your tote bags to you as quickly and efficiently as possible.
          This policy outlines our shipping procedures, delivery times, and other important information
          regarding the delivery of your orders.
        </p>

        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            Due to the ongoing COVID-19 pandemic, there may be delays in shipping and delivery times.
            We appreciate your patience and understanding during this time.
          </AlertDescription>
        </Alert>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Shipping Methods & Timeframes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-medium">Standard Shipping</h3>
              </div>
              <p className="text-muted-foreground mb-2">Delivery in 5-7 business days</p>
              <p className="font-medium">₹99 for orders under ₹999</p>
              <p className="font-medium">FREE for orders ₹999 and above</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-medium">Express Shipping</h3>
              </div>
              <p className="text-muted-foreground mb-2">Delivery in 2-3 business days</p>
              <p className="font-medium">₹199 for all orders</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Domestic Shipping (Within India)</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Location</th>
                <th className="py-2 text-left">Standard Shipping</th>
                <th className="py-2 text-left">Express Shipping</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Metro Cities</td>
                <td className="py-2">3-5 business days</td>
                <td className="py-2">1-2 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Other Cities</td>
                <td className="py-2">5-7 business days</td>
                <td className="py-2">2-3 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Remote Areas</td>
                <td className="py-2">7-10 business days</td>
                <td className="py-2">3-5 business days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">International Shipping</h3>
          <p className="mb-4">
            We currently ship to the following countries with the estimated delivery times below:
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Region</th>
                <th className="py-2 text-left">Standard Shipping</th>
                <th className="py-2 text-left">Express Shipping</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">USA & Canada</td>
                <td className="py-2">10-15 business days</td>
                <td className="py-2">5-7 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Europe</td>
                <td className="py-2">10-15 business days</td>
                <td className="py-2">5-7 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Asia Pacific</td>
                <td className="py-2">7-12 business days</td>
                <td className="py-2">3-5 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Middle East</td>
                <td className="py-2">12-18 business days</td>
                <td className="py-2">7-10 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Rest of World</td>
                <td className="py-2">15-20 business days</td>
                <td className="py-2">10-15 business days</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-sm text-muted-foreground">
            Note: International customers may be subject to customs fees, duties, and taxes,
            which are the responsibility of the customer.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Shipping Details & FAQs</h2>

        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I track my order?</AccordionTrigger>
            <AccordionContent>
              <p>
                Once your order is shipped, you will receive an email with tracking information.
                You can also track your order by logging into your account and viewing your order history.
                Please allow 24-48 hours after receiving your shipping confirmation for the tracking
                information to become active.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>Which courier services do you use?</AccordionTrigger>
            <AccordionContent>
              <p>
                We primarily ship through BlueDart, DTDC, and FedEx for domestic orders.
                For international shipping, we use DHL and FedEx. The specific courier
                service used may vary based on your location and the shipping method selected.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Do you ship to PO boxes?</AccordionTrigger>
            <AccordionContent>
              <p>
                We do not ship to PO boxes for international orders. For domestic orders within India,
                we can ship to PO boxes, but please note that delivery times may be longer and tracking
                information might be limited.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>What if I'm not available when my order is delivered?</AccordionTrigger>
            <AccordionContent>
              <p>
                If you're not available at the time of delivery, the courier will typically attempt
                to deliver again the next business day. After multiple failed delivery attempts,
                the package may be held at the local courier facility for pickup. You will receive
                notifications from the courier regarding delivery attempts and next steps.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>Do you offer same-day or next-day delivery?</AccordionTrigger>
            <AccordionContent>
              <p>
                We currently do not offer same-day delivery. Next-day delivery may be available
                for select metro cities in India, depending on inventory availability and order
                placement time. This option, if available, will be shown during checkout.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Shipping Policy Updates</h2>
        <p>
          We reserve the right to modify this shipping policy at any time. Changes will be
          effective immediately upon posting to our website. We encourage customers to
          check this page periodically for updates.
        </p>
        <p className="mt-4">
          Last updated: June 15, 2023
        </p>

        <div className="mt-8 p-4 border rounded-md bg-muted">
          <h3 className="font-medium mb-2">Contact Us</h3>
          <p>
            If you have any questions about our shipping policy, please contact our customer
            service team at <a href="mailto:support@konipai.in" className="text-primary hover:underline">support@konipai.in</a> or
            call us at +91 (123) 456-7890.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy; 