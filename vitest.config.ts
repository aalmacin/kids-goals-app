import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? 'test', process.cwd(), ['NEXT_PUBLIC_', 'SUPABASE_'])
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      include: ['__tests__/unit/**/*.test.ts', '__tests__/integration/**/*.test.ts'],
      testTimeout: 30000,
      environmentMatchGlobs: [
        ['__tests__/unit/**', 'jsdom'],
        ['__tests__/integration/**', 'node'],
      ],
      env,
      coverage: {
        provider: 'v8',
        include: ['lib/**/*.ts'],
        exclude: ['lib/database.types.ts'],
      },
    },
  }
})
