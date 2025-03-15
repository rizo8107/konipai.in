/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string
  readonly POCKETBASE_ADMIN_EMAIL: string
  readonly POCKETBASE_ADMIN_PASSWORD: string
  readonly NODE_ENV: 'development' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}