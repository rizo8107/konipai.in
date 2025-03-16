import React, { Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { Loader2 } from "lucide-react";

// Eagerly loaded components
import Index from "./pages/Index"

// Lazy loaded components
const Shop = React.lazy(() => import("./pages/Shop"))
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"))
const Bestsellers = React.lazy(() => import("./pages/Bestsellers"))
const NewArrivals = React.lazy(() => import("./pages/NewArrivals"))
const About = React.lazy(() => import("./pages/About"))
const Checkout = React.lazy(() => import("./pages/Checkout"))
const NotFound = React.lazy(() => import("./pages/NotFound"))
const LoginPage = React.lazy(() => import("./pages/auth/login"))
const SignupPage = React.lazy(() => import("./pages/auth/signup"))
const ForgotPasswordPage = React.lazy(() => import("./pages/auth/forgot-password"))
const ResetPasswordPage = React.lazy(() => import("./pages/auth/reset-password"))
const ProfilePage = React.lazy(() => import("./pages/profile"))
const OrderDetail = React.lazy(() => import("./pages/OrderDetail"))
const OrderConfirmation = React.lazy(() => import("./pages/order-confirmation"))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[80vh]">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />
  }

  return <>{children}</>
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
              <RouterRoutes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/bestsellers" element={<Bestsellers />} />
                <Route path="/new-arrivals" element={<NewArrivals />} />
                <Route path="/about" element={<About />} />
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