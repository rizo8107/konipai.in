import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <img src="/logo.svg" alt="Konipai Logo" className="h-8 w-8" />
      <span className="font-bold text-xl">Konipai</span>
    </Link>
  )
} 