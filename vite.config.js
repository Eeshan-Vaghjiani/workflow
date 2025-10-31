import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.tsx'],
      refresh: true,
    }),
    react(),
  ],
  optimizeDeps: {
    include: ['gantt-task-react'],
  },
  build: {
    outDir: 'public/build',        // 👈 important
    emptyOutDir: true,             // clears old builds
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes('/*#__PURE__*/')) return;
        warn(warning);
      },
    },
  },
});
