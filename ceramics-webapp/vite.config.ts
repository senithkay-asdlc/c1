import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served at host root — never set `base`.
export default defineConfig({
  plugins: [react()],
});
