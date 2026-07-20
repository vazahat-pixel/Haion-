import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reactRoot = path.resolve(__dirname, 'node_modules/react');
const reactDomRoot = path.resolve(__dirname, 'node_modules/react-dom');

/** Single React instance — prevents "Invalid hook call" from zustand / radix / etc. */
const reactAliases = {
  react: reactRoot,
  'react-dom': reactDomRoot,
  'react/jsx-runtime': path.join(reactRoot, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.join(reactRoot, 'jsx-dev-runtime.js'),
  'react-dom/client': path.join(reactDomRoot, 'client.js'),
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'zustand'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      ...reactAliases,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'zustand',
      'zustand/react',
      'framer-motion',
      '@tanstack/react-query',
      'react-router-dom',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand', '@tanstack/react-query', 'immer'],
          'vendor-ui': ['framer-motion', 'recharts', 'lucide-react'],
        },
      },
    },
  },
});
