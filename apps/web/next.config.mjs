/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@personaforge/core"],
  reactStrictMode: true,
  experimental: {
    // Enable Server Actions if needed
  },
};

export default nextConfig;
