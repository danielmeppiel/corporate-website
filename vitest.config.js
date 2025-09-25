import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/js',
      include: ['src/**/*.{js,ts,jsx,tsx}', 'main.js'],
      exclude: ['node_modules/', 'dist/', 'tests/', '**/*.test.*', '**/*.spec.*']
    }
  }
})