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
        maxParallelFileOps: 3,
        // Disable treeshake to speed up build (we'll rely on terser)
        treeshake: false,
        output: {
          // Simpler chunking strategy to reduce memory usage
          manualChunks: {
            'vendor': [
              'react', 
              'react-dom', 
              'react-router-dom',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-slot',
              'lucide-react',
            ],
            'app': [
              './src/App.tsx',
              './src/main.tsx',
              './src/routes.tsx',
            ],
          },
          // Configure code splitting
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
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
      // Skip dependency optimization in production to save memory
      disabled: mode === 'production',
      // Limit esbuild memory usage
      esbuildOptions: {
        logLevel: 'error', // Reduce log verbosity
        logLimit: 0, // Disable logging to save memory
        treeShaking: false, // Disable tree shaking to reduce memory usage
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
      },
      // Disable dependency optimization for EasyPanel builds
      optimizeDeps: {
        disabled: true,
      },
    };
  }
  
  return config;
});
