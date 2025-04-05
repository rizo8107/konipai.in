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
    // Disable sourcemaps to reduce memory usage
    sourcemap: false,
    // Optimize chunks to improve caching
    rollupOptions: {
      output: {
        // Ensure React is bundled properly
        manualChunks: {
          // Keep React and React DOM together
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-toast', 'lucide-react'],
          // Other common dependencies
          'utils-vendor': ['pocketbase', 'clsx', 'tailwind-merge']
        },
        // Configure code splitting
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },
    // Use esbuild for faster builds with less memory
    minify: 'esbuild',
    // Improve chunk loading
    target: 'esnext',
    assetsInlineLimit: 8192, // Inline more assets to reduce file count
    // Chunk size warnings threshold - increase to reduce noise
    chunkSizeWarningLimit: 1000,
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  },
  optimizeDeps: {
    exclude: ['lovable-tagger'] // Exclude the image optimizer
  },
  // Enable brotli compression for even better compression (when supported by the server)
  preview: {
    host: "::",
    port: 8080,
  },
}));
