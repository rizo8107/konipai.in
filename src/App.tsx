import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { Toaster } from "@/components/ui/toaster"
import { Routes } from "./routes"
import { MetaPixel } from "./components/MetaPixel"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <CartProvider>
          <MetaPixel />
          <Routes />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
