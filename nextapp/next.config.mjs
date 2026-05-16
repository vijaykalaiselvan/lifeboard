/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "@neondatabase/serverless"],
};

export default nextConfig;
