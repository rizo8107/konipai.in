import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
    sourcemap: false, // Disable sourcemaps to reduce memory usage
    // Optimize chunks to improve caching
    rollupOptions: {
      output: {
        // Limit the number of chunks to reduce memory usage
        manualChunks: (id) => {
          // Group all node_modules together
          if (id.includes('node_modules')) {
            // Handle react and related packages
            if (id.includes('/react') || id.includes('/react-dom') || id.includes('/react-router')) {
              return 'vendor-react';
            }
            
            // Handle UI libraries
            if (id.includes('@radix-ui') || id.includes('@shadcn') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            
            // All other dependencies
            return 'vendor';
          }
          
          // Group app code by main directories to reduce chunk count
          if (id.includes('/src/components/')) {
            return 'components';
          }
          
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
        },
        // Configure code splitting with fewer chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Limit the number of entry points processed concurrently
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },
    // Use esbuild for faster builds with less memory
    minify: 'esbuild',
    // Disable CSS code splitting to reduce the number of generated files
    cssCodeSplit: false,
    // Improve chunk loading
    target: 'esnext',
    assetsInlineLimit: 8192, // Inline more assets to reduce file count
    // Chunk size warnings threshold - increase to reduce noise
    chunkSizeWarningLimit: 1000,
  },
  // Enable brotli compression for even better compression (when supported by the server)
  preview: {
    host: "::",
    port: 8080,
  },
}));
