import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/razorpay': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Generate sourcemaps for debugging in production
    sourcemap: mode === 'development',
    // Optimize chunks to improve caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Handle react and react-dom
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          
          // Handle react-router-dom
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
          }
          
          // Handle react-intersection-observer specifically
          if (id.includes('node_modules/react-intersection-observer/')) {
            return 'utils';
          }
          
          // Handle all radix UI components
          if (id.includes('node_modules/@radix-ui/react-')) {
            return 'ui';
          }
          
          // Handle PDF generation libraries
          if (id.includes('node_modules/html2pdf.js') || 
              id.includes('node_modules/html2canvas') || 
              id.includes('node_modules/jspdf')) {
            return 'pdf-generation';
          }
          
          // Handle form libraries
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform') || 
              id.includes('node_modules/zod')) {
            return 'form';
          }
          
          // Handle date libraries
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/react-day-picker')) {
            return 'date-utils';
          }
        },
        // Configure code splitting
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    // Optimize minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Improve chunk loading
    target: 'esnext',
    assetsInlineLimit: 4096, // Inline small assets to reduce HTTP requests
  },
  // Enable brotli compression for even better compression (when supported by the server)
  preview: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/razorpay': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
}));
