/** @type {import('next').NextConfig} */
const nextConfig = {
  // The original site uses trailing slashes on every URL (/stores/, /catalogue/...).
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      // admin image uploads (validated to ≤ 5 MB in src/lib/storage.ts)
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
