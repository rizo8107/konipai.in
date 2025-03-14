import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import CartDrawer from './CartDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open menu</span>
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Logo */}
          <div className="flex lg:flex-1 items-center justify-center lg:justify-start">
            <Link to="/" className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-[#219898]" />
              <span className="text-xl font-bold tracking-tight text-[#219898]">KONIPAI</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden lg:flex space-x-8 mr-12">
            {[
              { to: "/shop", text: "Shop" },
              { to: "/bestsellers", text: "Bestsellers" },
              { to: "/new-arrivals", text: "New Arrivals" },
              { to: "/about", text: "About" }
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-konipai-mint transition-colors"
              >
                {link.text}
              </Link>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-6">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-2 hover:text-konipai-mint transition-colors"
                    aria-label="Open profile menu"
                  >
                    <User className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-3">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth/login" className="p-2 hover:text-konipai-mint transition-colors">
                <User className="h-6 w-6" />
              </Link>
            )}
            <button
              type="button"
              className="p-2 relative hover:text-konipai-mint transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-konipai-mint text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`fixed inset-0 bg-white z-50 lg:hidden transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <ShoppingBag className="h-6 w-6 text-[#219898]" />
            <span className="text-xl font-bold tracking-tight text-[#219898]">KONIPAI</span>
          </Link>
          <button
            type="button"
            className="p-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-4">
          {[
            { to: "/shop", text: "Shop" },
            { to: "/bestsellers", text: "Bestsellers" },
            { to: "/new-arrivals", text: "New Arrivals" },
            { to: "/about", text: "About" },
            ...(user ? [{ to: "/profile", text: "Profile" }] : [{ to: "/auth/login", text: "Login" }])
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="py-2 text-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.text}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="py-2 text-lg text-left flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </button>
          )}
        </nav>
      </div>
      
      <CartDrawer />
    </header>
  );
};

export default Navbar;