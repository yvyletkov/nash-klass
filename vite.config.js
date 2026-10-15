import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + HashRouter: работает на GitHub Pages при любом имени репозитория
export default defineConfig({
  base: './',
  plugins: [react()],
  preview: { allowedHosts: true }, // нужно для временной ссылки через туннель
})
