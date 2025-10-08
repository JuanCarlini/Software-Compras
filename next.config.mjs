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
  // Configuración para usar src/ directory
  experimental: {
    typedRoutes: false,
  },
}

export default nextConfig
