import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": "http://3.129.70.68:3000",
    },
    allowedHosts: ["trackingplaces.ddns.net"],
    cors: true,
  },
})
