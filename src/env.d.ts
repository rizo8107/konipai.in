/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_RAZORPAY_KEY_SECRET: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_RAZORPAY_PROXY_URL?: string;
  readonly VITE_RAZORPAY_PROXY_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}