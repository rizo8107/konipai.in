import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import html2pdf from 'html2pdf.js';
import { useToast } from '@/components/ui/use-toast';

// Define interfaces for products in order
interface OrderProduct {
  productId?: string;
  product?: {
    id?: string;
    name?: string;
    price?: number;
    images?: string[];
  };
  name?: string;
  price?: number;
  quantity: number;
  color?: string;
  discount?: number;
  coupon?: string;
}

// Define interface for order
interface Order {
  id: string;
  created?: string;
  updated?: string;
  products: string | OrderProduct[];
  subtotal: number;
  total: number;
  shipping_cost: number | null;
  payment_status: string;
  payment_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  coupon_code?: string;
  discount_amount?: number;
  expand?: {
    shipping_address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    user?: {
      id: string;
      email: string;
    };
  };
  tax?: number;
}

interface OrderInvoiceProps {
  order: Order;
  products: OrderProduct[];
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

export function OrderInvoice({ order, products }: OrderInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const { toast } = useToast();

  // Get the logo URL for embedding in the invoice
  useEffect(() => {
    // Try to get the logo from the environment variables
    const envLogo = import.meta.env.VITE_SITE_LOGO;
    
    // Default hardcoded logo URL as fallback
    const defaultLogo = 'https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_3420988878/m8l91o34i2i54z0/logo_lbgs7rzev4.svg?thumb=0x0';
    
    setLogoUrl(envLogo || defaultLogo);
  }, []);

  const handlePrint = () => {
    try {
      const printContents = invoiceRef.current?.innerHTML;
      const originalContents = document.body.innerHTML;

      if (printContents) {
        document.body.innerHTML = `
          <html>
            <head>
              <title>Order Invoice #${order.id}</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
                .invoice-section { margin-bottom: 1.5rem; }
                .invoice-table { width: 100%; border-collapse: collapse; }
                .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
                .invoice-table th { background-color: #f9fafb; }
                .text-right { text-align: right; }
                .totals-table { width: 100%; max-width: 400px; margin-left: auto; }
                .totals-table td { padding: 0.5rem 0; }
                .totals-table .total-row { font-weight: bold; border-top: 1px solid #ddd; }
                .company-info { margin-top: 3rem; font-size: 0.875rem; color: #6b7280; }
                @media print {
                  body { -webkit-print-color-adjust: exact; color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${printContents}
            </body>
          </html>
        `;
        
        // Track the print event before actual printing
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'invoice_print',
            order_id: order.id,
            order_value: order.total
          });
        }
        
        window.print();
        document.body.innerHTML = originalContents;
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to print invoice. Please try downloading instead.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    try {
      const invoiceContent = invoiceRef.current?.cloneNode(true) as HTMLElement;
      
      // Replace Logo component with direct image tag for HTML export
      if (invoiceContent) {
        const logoDiv = invoiceContent.querySelector('.logo-container');
        if (logoDiv && logoUrl) {
          logoDiv.innerHTML = `<img src="${logoUrl}" alt="ZentharaStudios" class="h-12" />`;
        }
      }

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order Invoice #${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 2rem; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
              .invoice-section { margin-bottom: 1.5rem; }
              .invoice-table { width: 100%; border-collapse: collapse; }
              .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
              .invoice-table th { background-color: #f9fafb; }
              .text-right { text-align: right; }
              .totals-table { width: 100%; max-width: 400px; margin-left: auto; }
              .totals-table td { padding: 0.5rem 0; }
              .totals-table .total-row { font-weight: bold; border-top: 1px solid #ddd; }
              .company-info { margin-top: 3rem; font-size: 0.875rem; color: #6b7280; }
            </style>
          </head>
          <body>
            ${invoiceContent?.innerHTML || invoiceRef.current?.innerHTML}
          </body>
        </html>
      `;

      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${order.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Track the download event
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'invoice_download',
          download_format: 'html',
          order_id: order.id,
          order_value: order.total
        });
      }
    } catch (error) {
      console.error('Error generating HTML invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate HTML invoice.",
        variant: "destructive"
      });
    }
  };

  // Add PDF download function
  const handleDownloadPDF = () => {
    try {
      // Check if html2pdf is available
      if (typeof html2pdf === 'undefined') {
        console.error('html2pdf is not available');
        toast({
          title: "Error",
          description: "PDF generation library is not available. Please try HTML download instead.",
          variant: "destructive"
        });
        return;
      }
      
      // Clone the invoice content for PDF generation
      const invoiceContent = invoiceRef.current?.cloneNode(true) as HTMLElement;
      
      // Replace Logo component with direct image for PDF export
      if (invoiceContent) {
        const logoDiv = invoiceContent.querySelector('.logo-container');
        if (logoDiv && logoUrl) {
          logoDiv.innerHTML = `<img src="${logoUrl}" alt="ZentharaStudios" style="height: 48px;" />`;
        }
      }
      
      const options = {
        margin: [10, 10],
        filename: `Invoice-${order.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate PDF
      html2pdf()
        .from(invoiceContent || invoiceRef.current)
        .set(options)
        .save()
        .then(() => {
          // Track the download event
          if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
              event: 'invoice_download',
              download_format: 'pdf',
              order_id: order.id,
              order_value: order.total
            });
          }
        });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try HTML download instead.",
        variant: "destructive"
      });
    }
  };

  const shippingAddress = order.expand?.shipping_address;
  const orderDate = formatDate(order.created);
  const invoiceDate = formatDate(order.updated);

  return (
    <div className="mt-6">
      <div className="flex justify-end space-x-3 mb-4">
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          HTML
        </Button>
        <Button onClick={handleDownloadPDF} variant="default" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          PDF
        </Button>
      </div>
      
      <div 
        ref={invoiceRef} 
        className="bg-white p-6 border rounded-lg shadow-sm print:shadow-none print:border-none"
      >
        <div className="invoice-header flex justify-between items-start mb-8">
          <div>
            <div className="mb-4 logo-container">
              <Logo className="h-12" />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-bold text-gray-800">ZentharaStudios</p>
              <p>Vignarajapuram 1st Cross Street</p>
              <p>Chennai, Tamil Nadu 600073</p>
              <p>India</p>
            
            </div>
          </div>
          
          <div className="text-right">
            <h1 className="text-xl font-bold text-gray-800 mb-1">INVOICE</h1>
            <p className="text-sm text-gray-600">#INV-{order.id}</p>
            <div className="mt-4 text-sm text-gray-600">
              <p><span className="font-medium">Order Date:</span> {orderDate}</p>
              <p><span className="font-medium">Invoice Date:</span> {invoiceDate}</p>
              <p><span className="font-medium">Payment Status:</span> {order.payment_status === 'paid' ? 'Paid' : 'Pending'}</p>
              {order.payment_id && (
                <p><span className="font-medium">Payment ID:</span> {order.payment_id}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="invoice-section grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-3 uppercase">Bill To:</h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800">{order.customer_name}</p>
              {shippingAddress && (
                <>
                  <p>{shippingAddress.street}</p>
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                  <p>{shippingAddress.country}</p>
                </>
              )}
              <p>{order.customer_email}</p>
              <p>{order.customer_phone}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-3 uppercase">Ship To:</h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800">{order.customer_name}</p>
              {shippingAddress && (
                <>
                  <p>{shippingAddress.street}</p>
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                  <p>{shippingAddress.country}</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="invoice-section mb-8">
          <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase">Order Summary</h2>
          <table className="invoice-table w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-center">Quantity</th>
                <th className="px-4 py-2 text-right">Unit Price</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, index) => {
                const name = item.name || item.product?.name || 'Product';
                const price = Number(item.price || item.product?.price || 0);
                const quantity = item.quantity || 1;
                const total = price * quantity;
                
                return (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">{name}</p>
                        {item.color && <p className="text-gray-500 text-xs">Color: {item.color}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">{quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(price)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="invoice-section">
          <table className="totals-table ml-auto text-sm">
            <tbody>
              <tr>
                <td className="font-medium">Subtotal:</td>
                <td className="text-right">{formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td className="font-medium">Shipping:</td>
                <td className="text-right">
                  {order.shipping_cost === null || order.shipping_cost === 0
                    ? 'Free'
                    : formatCurrency(order.shipping_cost)}
                </td>
              </tr>
              {order.discount_amount && order.discount_amount > 0 && (
                <tr>
                  <td className="font-medium">Discount:</td>
                  <td className="text-right">-{formatCurrency(order.discount_amount)}</td>
                </tr>
              )}
              {order.tax && order.tax > 0 && (
                <tr>
                  <td className="font-medium">Tax:</td>
                  <td className="text-right">{formatCurrency(order.tax)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td className="font-bold pt-3">Total:</td>
                <td className="text-right font-bold pt-3">{formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="invoice-section mt-10 border-t pt-8">
          <div className="max-w-2xl mx-auto text-center text-sm text-gray-600">
            <p className="mb-1 font-medium">Thank you for your purchase!</p>
            <p>If you have any questions about this invoice, please contact our customer support:</p>
            <p className="mt-1">support@zenthrastudios.com | +91 1234567890</p>
          </div>
        </div>
        
        <div className="company-info text-xs text-gray-500 mt-10 pt-4 border-t">
          <p>ZentharaStudios | Registered in India | Company No: 123456789</p>
        </div>
      </div>
    </div>
  );
} 