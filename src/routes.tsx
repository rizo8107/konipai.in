import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { lazy, Suspense, useEffect } from "react"
import { Loader2 } from "lucide-react"

// Eager load critical pages
import Index from "./pages/Index"

// Lazy load non-critical pages
const Shop = lazy(() => import("./pages/Shop"))
const ProductDetail = lazy(() => import("./pages/ProductDetail"))
const Bestsellers = lazy(() => import("./pages/Bestsellers"))
const NewArrivals = lazy(() => import("./pages/NewArrivals"))
const About = lazy(() => import("./pages/About"))
const Checkout = lazy(() => import("./pages/Checkout"))
const NotFound = lazy(() => import("./pages/NotFound"))
const LoginPage = lazy(() => import("./pages/auth/login"))
const SignupPage = lazy(() => import("./pages/auth/signup"))
const ForgotPasswordPage = lazy(() => import("./pages/auth/forgot-password"))
const ResetPasswordPage = lazy(() => import("./pages/auth/reset-password"))
const ProfilePage = lazy(() => import("./pages/profile"))
const OrderDetail = lazy(() => import("./pages/OrderDetail"))
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"))
const Orders = lazy(() => import("./pages/Orders"))

// Policy pages
const ContactUs = lazy(() => import("./pages/ContactUs"))
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"))
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"))
const CancellationsRefunds = lazy(() => import("./pages/CancellationsRefunds"))
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />
  }

  return <>{children}</>
}

// Loading fallback for lazy-loaded components
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

// Scroll restoration component to ensure pages start at the top when navigating
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

export function Routes() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Sonner />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <ScrollToTop />
              <RouterRoutes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/bestsellers" element={<Bestsellers />} />
                <Route path="/new-arrivals" element={<NewArrivals />} />
                <Route path="/about" element={<About />} />
                
                {/* Policy Pages */}
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/cancellations-refunds" element={<CancellationsRefunds />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                <Route
                  path="/checkout"
                  element={
                    <PrivateRoute>
                      <Checkout />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/order-confirmation/:orderId"
                  element={
                    <PrivateRoute>
                      <OrderConfirmation />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <PrivateRoute>
                      <Orders />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/orders/:orderId"
                  element={
                    <PrivateRoute>
                      <OrderDetail />
                    </PrivateRoute>
                  }
                />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/signup" element={<SignupPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </RouterRoutes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  )
} 