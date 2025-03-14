import { Link } from 'react-router-dom';
import { Mail, Instagram, Facebook, Twitter, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-[#219898] text-white">
      <div className="konipai-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6" />
              <h2 className="text-2xl font-bold tracking-tight">KONIPAI</h2>
            </div>
            <p className="text-white/80">
              Sustainable tote bags crafted with care for the modern lifestyle. Making a difference, one bag at a time.
            </p>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                asChild
              >
                <a href="https://instagram.com" aria-label="Follow us on Instagram">
                  <Instagram size={18} />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                asChild
              >
                <a href="https://facebook.com" aria-label="Follow us on Facebook">
                  <Facebook size={18} />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                asChild
              >
                <a href="https://twitter.com" aria-label="Follow us on Twitter">
                  <Twitter size={18} />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                asChild
              >
                <a href="mailto:hello@konipai.com" aria-label="Email us">
                  <Mail size={18} />
                </a>
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-2">
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
          
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-4 text-lg">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-white/80 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-white/80 hover:text-white transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-4">
            <h3 className="font-semibold mb-4 text-lg">Stay Updated</h3>
            <p className="text-white/80 mb-4">
              Subscribe to our newsletter for exclusive offers and updates.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:border-white/40"
              />
              <Button className="bg-white text-[#219898] hover:bg-white/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/80 text-sm">
            <p>© {new Date().getFullYear()} Konipai. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
