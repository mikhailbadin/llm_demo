import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Сайт живёт на https://mikhailbadin.github.io/llm_demo/, поэтому все ссылки на
  // ассеты должны быть с префиксом имени репозитория.
  base: '/llm_demo/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // Предварительно собираем тяжёлые зависимости ленивых сцен, чтобы Vite не пересобирал их на лету
    // (иначе в dev-режиме появляется вторая копия React и ошибка «Invalid hook call»).
    include: ['three', '@react-three/fiber', '@react-three/drei', 'camera-controls', 'zustand', 'katex', '@radix-ui/react-popover', '@radix-ui/react-tooltip', 'react-router-dom'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
