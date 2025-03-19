/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string
  readonly POCKETBASE_ADMIN_EMAIL: string
  readonly POCKETBASE_ADMIN_PASSWORD: string
  readonly NODE_ENV: 'development' | 'production'
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_SITE_LOGO: string
  readonly VITE_SITE_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}