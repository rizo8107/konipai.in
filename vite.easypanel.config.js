// Ultra-lightweight Vite configuration for EasyPanel builds
// This configuration prioritizes minimal memory usage over all other concerns

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Basic server config
  server: {
    host: "::",
    port: 8080,
  },
  // Minimal plugins
  plugins: [
    react({
      // Use faster SWC minification instead of Babel
      jsxImportSource: undefined,
    }),
  ],
  // Simple path alias
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable sourcemaps completely
    sourcemap: false,
    // Use simplest possible chunking strategy
    rollupOptions: {
      // Disable treeshake to save memory
      treeshake: false,
      output: {
        // Simplest possible chunking - just vendor and app
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
          ],
          'app': [
            './src/main.tsx',
          ],
        },
        // Simple naming
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      }
    },
    // Use fastest minification
    minify: 'esbuild',
    // Disable all reporting
    reportCompressedSize: false,
    // Increase limit to avoid warnings
    chunkSizeWarningLimit: 5000,
    // Limit concurrent operations
    emptyOutDir: true,
  },
  // Disable dependency optimization completely
  optimizeDeps: {
    disabled: true,
  },
});
