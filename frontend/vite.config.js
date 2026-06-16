import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Set VITE_TUNNEL=1 in the shell when running through ngrok or a similar
// HTTPS tunnel. Only then do we override the HMR client port — leaving it
// untouched for plain localhost dev means HMR "just works" on both setups
// without manually editing this file each time.
const isTunnel = process.env.VITE_TUNNEL === '1';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,          // bind to 0.0.0.0 so LAN / ngrok can reach the dev server
    strictPort: true,
    // Vite 5+ blocks Host headers it doesn't recognise (DNS-rebinding guard).
    // Entries starting with `.` match that domain and all subdomains.
    // Ngrok issues hosts on multiple TLDs (-free.dev is the newest, then
    // -free.app, plus the paid .ngrok.app and legacy .ngrok.io).
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.app',
      '.ngrok.io',
    ],
    // Only force HMR over https/443 when explicitly tunnelling. Without
    // this guard, plain localhost:5173 would also try ws://localhost:443
    // and spin in an endless "server connection lost. Polling for restart…"
    // loop because nothing listens on 443 locally.
    ...(isTunnel && { hmr: { clientPort: 443 } }),
  },
});
