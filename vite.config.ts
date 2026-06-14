import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': 'http://localhost:3001',
        '/socket.io': {
          target: 'ws://localhost:3001',
          ws: true
        }
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      minify: 'esbuild',
      cssMinify: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'qrcode.react',
      ],
      exclude: [
        'html2canvas',
        'jspdf',
        'tesseract.js',
        'html-to-image',
        '@google/genai',
      ],
    },
  };
});
