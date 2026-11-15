import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Environment variables are read from this repo's own `.env` (see `.env.example`).
// Only VITE_-prefixed vars are exposed to the client bundle.
export default defineConfig({
  plugins: [react()],
});
