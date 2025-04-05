import { defineConfig, loadEnv, ConfigEnv, UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check if this is an EasyPanel build
  const isEasyPanelBuild = env.EASYPANEL_BUILD === 'true';
  
  const config: UserConfig = {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react({
        // Use faster SWC minification instead of Babel
        jsxImportSource: undefined,
        // Reduce memory usage by disabling unnecessary features
        plugins: [],
      }),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Disable sourcemaps completely to save memory
      sourcemap: false,
      // Optimize chunks to improve caching and reduce memory usage
      rollupOptions: {
        // Reduce memory usage by limiting parallelism
        maxParallelFileOps: 2,
        // Enable more targeted treeshaking for better optimization
        treeshake: true,
        output: {
          // More optimized chunking strategy
          manualChunks(id) {
            // Group core React runtime
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/')) {
              return 'react-runtime';
            }
            
            // Group React router
            if (id.includes('node_modules/react-router') || 
                id.includes('node_modules/@remix-run/router')) {
              return 'router';
            }
            
            // Group Radix UI components
            if (id.includes('node_modules/@radix-ui/')) {
              return 'ui-components';
            }
            
            // Group lucide icons
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            
            // Group utilities
            if (id.includes('node_modules/clsx') || 
                id.includes('node_modules/tailwind-merge') ||
                id.includes('node_modules/class-variance-authority')) {
              return 'utils';
            }
          },
          // Optimize asset filenames
          chunkFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8].[ext]',
        }
      },
      // Use faster esbuild minification instead of terser
      minify: 'esbuild',
      // Improve chunk loading
      target: 'esnext',
      assetsInlineLimit: 4096, // Inline small assets to reduce HTTP requests
      // Limit concurrent file operations to reduce memory pressure
      emptyOutDir: true,
      reportCompressedSize: false, // Disable compressed size reporting to save memory
      chunkSizeWarningLimit: 2000, // Increase warning limit to reduce noise
    },
    // Optimize build performance
    optimizeDeps: {
      // Better dependency discovery
      disabled: false,
      // Optimize esbuild memory usage
      esbuildOptions: {
        logLevel: 'error', // Reduce log verbosity
        logLimit: 0, // Disable logging to save memory
        treeShaking: true, // Enable tree shaking for better optimization
      }
    },
    preview: {
      host: "::",
      port: 8080,
    },
  };
  
  // Apply EasyPanel optimizations if needed
  if (isEasyPanelBuild) {
    return {
      ...config,
      // Disable sourcemaps completely for EasyPanel builds
      build: {
        ...config.build,
        sourcemap: false,
        // Use simplest possible chunking strategy
        rollupOptions: {
          // Reduce parallel operations even further for memory-constrained environments
          maxParallelFileOps: 1,
          // Disable treeshake for the first build pass to save memory
          treeshake: false,
          output: {
            // Simplest possible chunking to save memory
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
            // Simple naming for faster builds
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
      },
      // Optimize dependency handling
      optimizeDeps: {
        // Only include key dependencies
        include: ['react', 'react-dom', 'react-router-dom'],
        // Exclude large libraries to reduce memory usage during build
        exclude: [
          '@tanstack/react-query',
          'recharts',
          'html2pdf.js',
          'date-fns',
          'embla-carousel-react'
        ],
        esbuildOptions: {
          logLevel: 'error',
          logLimit: 0,
          treeShaking: false,
        }
      },
    };
  }
  
  return config;
});
