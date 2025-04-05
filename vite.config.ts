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
    // Generate sourcemaps only in development to save memory in production
    sourcemap: mode === 'development',
    // Optimize chunks to improve caching and reduce memory usage
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group node_modules into larger chunks to reduce overhead
          if (id.includes('node_modules')) {
            // Handle react and react-dom
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            
            // Handle react-router-dom and related packages
            if (id.includes('/react-router') || id.includes('/@remix-run/')) {
              return 'vendor-router';
            }
            
            // Group UI-related libraries
            if (id.includes('/@radix-ui/') || 
                id.includes('/class-variance-authority/') || 
                id.includes('/clsx/') || 
                id.includes('/tailwind') ||
                id.includes('/lucide-react/')) {
              return 'vendor-ui';
            }
            
            // Group utility libraries
            if (id.includes('/date-fns/') || 
                id.includes('/react-intersection-observer/') ||
                id.includes('/sonner/') ||
                id.includes('/zod/')) {
              return 'vendor-utils';
            }
            
            // All other node_modules
            return 'vendor-other';
          }
          
          // Group application code by feature
          if (id.includes('/src/pages/')) {
            return 'app-pages';
          }
          
          if (id.includes('/src/components/')) {
            return 'app-components';
          }
          
          if (id.includes('/src/lib/') || id.includes('/src/utils/')) {
            return 'app-utils';
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
        passes: 2, // Additional optimization passes
      },
      format: {
        comments: false, // Remove comments to reduce size
      },
    },
    // Improve chunk loading
    target: 'esnext',
    assetsInlineLimit: 4096, // Inline small assets to reduce HTTP requests
    // Limit concurrent file operations to reduce memory pressure
    emptyOutDir: true,
    reportCompressedSize: false, // Disable compressed size reporting to save memory
    chunkSizeWarningLimit: 1000, // Increase warning limit to reduce noise
  },
  // Optimize build performance
  optimizeDeps: {
    // Force inclusion of these dependencies in the optimization step
    include: ['react', 'react-dom', 'react-router-dom'],
    // Skip optimization of these dependencies (typically large or problematic ones)
    exclude: [],
    // Limit esbuild memory usage
    esbuildOptions: {
      logLevel: 'error', // Reduce log verbosity
      logLimit: 0, // Disable logging to save memory
      treeShaking: true, // Enable tree shaking to reduce bundle size
    }
  },
  preview: {
    host: "::",
    port: 8080,
  },
}));
