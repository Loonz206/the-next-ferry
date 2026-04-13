import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files for the current mode (e.g. development, production).
  // The empty-string prefix loads all vars, not just VITE_-prefixed ones.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/the-next-ferry/',
    plugins: [react()],
    define: {
      // Expose explicitly allowlisted env vars to the client bundle as
      // process.env.KEY — only add vars that are safe to ship to the browser.
      //
      // Example (uncomment and rename when needed):
      // 'process.env.APP_PUBLIC_EXAMPLE': JSON.stringify(env.APP_PUBLIC_EXAMPLE ?? ''),

      // Intentionally empty: no server-side secrets (e.g. WSDOT_API_KEY) are
      // exposed here. Add future public-safe vars above.
      _ENV_LOADED: JSON.stringify(!!env),
    },
  }
})
