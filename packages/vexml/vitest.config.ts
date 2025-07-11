import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    setupFiles: ['vitest-canvas-mock'],
    environment: 'jsdom',
    // include only unit tests for now
    include: ['tests/unit/**/*.test.ts'],
  },
})
