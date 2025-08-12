/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export as static HTML for GitHub Pages
  output: 'export',
  // Repo name as base path when hosted on GitHub Pages
  basePath: '/ChairChart',
  assetPrefix: '/ChairChart/',
  // Helps avoid 404s on static hosting (serves index.html in folder)
  trailingSlash: true,
  // Required for static export (no Image Optimization server)
  images: { unoptimized: true },
};

export default nextConfig;
