// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove `output: 'export'` if you are deploying to a platform
  // that supports the full Next.js runtime (like Vercel or Netlify with Next.js runtime).
  // If you still need a purely static export for a different static host (not GitHub Pages),
  // you might keep it, but then API routes still won't work without a separate backend.
  // For now, I'll comment it out, assuming a more typical Next.js deployment.
  // output: 'export',

  // Your existing ESLint and TypeScript configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Images: unoptimized - Keep this if you are exporting statically.
  // If deploying to a platform like Vercel, you can remove this line
  // to use Next.js's optimized image component.
  // For now, keeping it for broader compatibility with static thinking.
  images: {
    unoptimized: true,
  },

  // basePath and assetPrefix are removed as they were specific to GitHub Pages subdirectory deployment.
  // If your deployment *does* require a basePath (e.g., serving from example.com/my-app/),
  // you would set it here directly:
  // basePath: '/my-app',
  // assetPrefix: '/my-app/',

  // publicRuntimeConfig related to basePath is removed.
  // If you had other public runtime configs, they would stay.
};

export default nextConfig;