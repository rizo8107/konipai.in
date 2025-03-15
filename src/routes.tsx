import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Index from "./pages/Index"
import Shop from "./pages/Shop"
import ProductDetail from "./pages/ProductDetail"
import Bestsellers from "./pages/Bestsellers"
import NewArrivals from "./pages/NewArrivals"
import About from "./pages/About"
import Checkout from "./pages/Checkout"
import NotFound from "./pages/NotFound"
import LoginPage from "./pages/auth/login"
import SignupPage from "./pages/auth/signup"
import ForgotPasswordPage from "./pages/auth/forgot-password"
import ResetPasswordPage from "./pages/auth/reset-password"
import ProfilePage from "./pages/profile"
import OrderDetail from "./pages/OrderDetail"
import OrderConfirmation from "./pages/order-confirmation"

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
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
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  )
} 