import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss() as any],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
