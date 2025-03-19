import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

const Footer = () => {
  return (
    <footer className="bg-[#219898] text-white">
      <div className="konipai-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <Link to="/" className="inline-block mb-6">
              <Logo variant="light" className="h-8" />
            </Link>
            <p className="text-white/80 mb-6">
              Crafting sustainable, stylish tote bags for the modern minimalist. 
              Each piece is thoughtfully designed to complement your lifestyle while making a positive impact.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4 text-lg">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-white/80 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/bestsellers" className="text-white/80 hover:text-white transition-colors">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="text-white/80 hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-4">
            <h3 className="font-semibold mb-4 text-lg">Policies</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-white/80 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-white/80 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="text-white/80 hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/cancellations-refunds" className="text-white/80 hover:text-white transition-colors">
                  Cancellations & Refunds
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-white/80 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-white/10">
        <div className="konipai-container py-6 flex flex-col md:flex-row justify-between items-center text-white/60 text-sm">
          <p>© {new Date().getFullYear()} Konipai. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/cancellations-refunds" className="hover:text-white transition-colors">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
