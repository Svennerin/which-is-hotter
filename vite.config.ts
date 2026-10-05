/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The map chunk is ~750 kB because the 50m country geometry is bundled on
    // purpose (no third-party host at runtime). It loads lazily, so the warning
    // is not actionable.
    chunkSizeWarningLimit: 900,
  },
  test: {
    // Pairing, sun maths and the API parser are pure TypeScript: no DOM needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
