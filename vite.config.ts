import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 47231,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 47231,
    strictPort: true,
  },
})
