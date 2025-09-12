import { defineConfig } from 'vite'

export default defineConfig({
  // Base public path when served in development or production
  base: './',
  
  // Server configuration for development
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Ensure compatibility with older browsers
    target: 'es2015',
    minify: 'esbuild', // Use esbuild instead of terser
    rollupOptions: {
      output: {
        // Clean asset names
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  }
})