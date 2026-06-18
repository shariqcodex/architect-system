/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) so the Electron
  // desktop build can run the real Next server — keeping the /api/coach route working.
  output: "standalone",
  // The app is fully client-rendered for game state, but we keep SSR for the shell.
  // Service worker + manifest are served statically from /public.
  experimental: {
    // Tree-shake heavy barrel-import libs so dev/build only compile what's used.
    // (recharts alone pulls thousands of modules via its index barrel.)
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
