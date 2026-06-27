import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://khugyibzsujjgtddwzpa.supabase.co https://*.supabase.co https://*.stripe.com",
        "media-src 'self' blob: data: https://khugyibzsujjgtddwzpa.supabase.co https://*.supabase.co",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "frame-src 'self' https://js.stripe.com https://*.stripe.com",
        "worker-src 'self' blob:",
      ].join('; '),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});