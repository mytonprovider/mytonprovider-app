import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import tsconfigPaths from 'vite-tsconfig-paths';

// UI_SRC points at the package checkout for live edits; without it the installed copy is used, as in a build.
const uiSrc = process.env.UI_SRC;

export default defineConfig(({ mode }) => ({
  base: '/',
  resolve: {
    // The package entry points this app imports.
    alias: uiSrc
      ? [
          { find: /^@myton\/ui$/, replacement: `${uiSrc}/src/index.ts` },
          { find: /^@myton\/ui\/domain$/, replacement: `${uiSrc}/src/domain/index.ts` },
          { find: /^@myton\/ui\/locale$/, replacement: `${uiSrc}/src/locale/index.ts` },
          { find: /^@myton\/ui\/styles\.css$/, replacement: `${uiSrc}/src/styles/index.css` },
          { find: /^@myton\/ui\/fonts\.css$/, replacement: `${uiSrc}/src/styles/fonts.css` },
          { find: /^@myton\/ui\/i18n$/, replacement: `${uiSrc}/src/i18n/index.ts` },
          { find: /^@myton\/ui\/text\.module\.css$/, replacement: `${uiSrc}/src/styles/text.module.css` },
          { find: /^@myton\/ui\/motion\.module\.css$/, replacement: `${uiSrc}/src/styles/motion.module.css` },
        ]
      : [],
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next'],
  },
  plugins: [
    react(),
    tsconfigPaths(),
    process.env.HTTPS && mkcert(),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
  },
  server: {
    host: true,
    // A stand reached through a proxy under its own name lists that name here, comma-separated.
    allowedHosts: process.env.ALLOWED_HOSTS?.split(','),
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...(uiSrc ? [uiSrc] : [])] },
    proxy: Object.fromEntries(
      ['/api', '/admin'].map((path) => [
        path,
        {
          target: loadEnv(mode, process.cwd(), '').BACKEND || 'http://localhost:8080',
          changeOrigin: true,
        },
      ]),
    ),
  },
}));
