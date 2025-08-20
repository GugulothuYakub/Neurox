// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // THIS IS CRUCIAL FOR CAPACITOR
  output: 'export',

  // Your existing ESLint and TypeScript configurations (fine for now)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Keep this for static export with Capacitor
  images: {
    unoptimized: true,
  },

  // basePath and assetPrefix are usually not needed for a standard Capacitor build
  // unless you have very specific routing requirements within the webview itself.
  // For a standard Capacitor app, the web content is served from the root.
  // So, keep these commented out or remove them unless you know you need them.
  // basePath: '/my-app',
  // assetPrefix: '/my-app/',
};

export default nextConfig;