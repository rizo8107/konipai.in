import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { Toaster } from "@/components/ui/toaster"
import { Routes } from "./routes"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <CartProvider>
          <Routes />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
