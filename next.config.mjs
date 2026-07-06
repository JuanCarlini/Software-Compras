/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // ✅ Habilitar ESLint warnings
  },
  typescript: {
    ignoreBuildErrors: false, // ✅ Habilitar TypeScript errors
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
