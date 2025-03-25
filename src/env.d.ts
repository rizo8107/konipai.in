/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string
  readonly POCKETBASE_ADMIN_EMAIL: string
  readonly POCKETBASE_ADMIN_PASSWORD: string
  readonly NODE_ENV: 'development' | 'production'
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_SITE_LOGO: string
  readonly VITE_SITE_TITLE: string
  
  // SMTP Configuration for Order Emails
  readonly SMTP_ENABLED?: string
  readonly SMTP_HOST?: string
  readonly SMTP_PORT?: string
  readonly SMTP_AUTH?: string
  readonly SMTP_USERNAME?: string
  readonly SMTP_PASSWORD?: string
  readonly SMTP_TLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}