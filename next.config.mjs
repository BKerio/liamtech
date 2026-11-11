/** @type {import('next').NextConfig} */
const nextConfig = {
  // The original site uses trailing slashes on every URL (/stores/, /catalogue/...).
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
