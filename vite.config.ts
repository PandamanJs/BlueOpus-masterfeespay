import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Master-Fees',
        short_name: 'Master-Fees',
        description: 'Quality Education is Within Reach',
        theme_color: '#003630',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  define: {
    'process.env': { NODE_ENV: '"development"' },
    'process.browser': 'true',
    'process.version': '"v20.0.0"',
    'process.platform': '"browser"',
    'process.argv': '[]',
    'process.cwd': '(() => "/")',
    'process.nextTick': '((fn) => setTimeout(fn, 0))',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // Browser stubs for Node.js built-ins used by posthog-node
      'node:async_hooks': path.resolve(__dirname, './src/lib/stubs/async_hooks.ts'),
      'async_hooks': path.resolve(__dirname, './src/lib/stubs/async_hooks.ts'),
      'node:fs': path.resolve(__dirname, './src/lib/stubs/fs.ts'),
      'node:readline': path.resolve(__dirname, './src/lib/stubs/readline.ts'),
      'node:path': path.resolve(__dirname, './src/lib/stubs/path.ts'),
      // 'path' (bare specifier) is also used by posthog-node error tracking modifiers
      // Vite aliases only apply to the browser bundle, not this config file itself
      'path': path.resolve(__dirname, './src/lib/stubs/path.ts'),
      'sonner@2.0.3': 'sonner',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'figma:asset/6d180ec5e608f311d21d72a46c32a5b15849c39d.png': path.resolve(__dirname, './src/assets/6d180ec5e608f311d21d72a46c32a5b15849c39d.png'),
      'figma:asset/5da21813da6fa21128f400330102b56ec04a15f5.png': path.resolve(__dirname, './src/assets/5da21813da6fa21128f400330102b56ec04a15f5.png'),
      'figma:asset/5454374a39c6c82a13d2a4e8bc2ca0899c331fc5.png': path.resolve(__dirname, './src/assets/5454374a39c6c82a13d2a4e8bc2ca0899c331fc5.png'),
      'figma:asset/15208e289d877eb8334ae7c27ebdb81b421618d1.png': path.resolve(__dirname, './src/assets/15208e289d877eb8334ae7c27ebdb81b421618d1.png'),
      'figma:asset/14e103bdb926a80d9f27d93b19086b97e7c47135.png': path.resolve(__dirname, './src/assets/14e103bdb926a80d9f27d93b19086b97e7c47135.png'),
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3001,
    open: true,
  },
});