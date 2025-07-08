"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
exports.default = (0, vite_1.defineConfig)(({ mode }) => ({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            "@": path_1.default.resolve(__dirname, "./src"),
            "@shared": path_1.default.resolve(__dirname, "shared"),
            "@assets": path_1.default.resolve(__dirname, "attached_assets"),
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
                target: "http://localhost:3000",
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
        target: 'es2015'
    }
}));
