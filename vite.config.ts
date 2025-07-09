import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Configuração de portas customizáveis
  const frontendPort = parseInt(process.env.VITE_PORT || process.env.FRONTEND_PORT || '5173');
  const backendPort = parseInt(process.env.VITE_BACKEND_PORT || process.env.BACKEND_PORT || '3000');
  
  console.log(`🎯 Frontend configurado para porta: ${frontendPort}`);
  console.log(`🎯 Backend configurado para porta: ${backendPort}`);

  return {
    plugins: [
      react({
        jsxImportSource: '@types/react',
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
          ]
        }
      })
    ],
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
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            query: ['@tanstack/react-query']
          },
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
      },
      emptyOutDir: true,
      target: 'es2020',
      minify: mode === 'production' ? 'esbuild' : false,
      sourcemap: mode === 'development',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
      exclude: [
        '@rollup/rollup-linux-x64-gnu',
        '@rollup/rollup-linux-arm64-gnu'
      ]
    },
    server: {
      port: frontendPort,
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
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production')
    },
    esbuild: {
      target: 'es2020',
      jsx: 'automatic'
    }
  };
});