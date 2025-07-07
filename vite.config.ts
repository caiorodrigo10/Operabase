import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      external: [
        '@rollup/rollup-linux-x64-gnu',
        '@rollup/rollup-linux-arm64-gnu',
        '@rollup/rollup-darwin-x64',
        '@rollup/rollup-darwin-arm64'
      ],
      output: {
        manualChunks: undefined,
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
    emptyOutDir: true,
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-arm64-gnu'
    ]
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: true,
      allow: [
        '..',
        '.',
        './src',
        './shared',
        './attached_assets'
      ],
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  esbuild: {
    target: 'es2015'
  }
});