import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { taroAdapter } from '@card-engine/ui/adapter/vite';

export default defineConfig({
  plugins: [react(), taroAdapter()],
});
