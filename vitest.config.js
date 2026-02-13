import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './coverage/js',
      include: ['src/**/*.{ts,tsx,js,jsx}', 'main.js'],
      exclude: ['node_modules/', 'tests/', 'dist/', 'coverage/']
    }
  }
})
