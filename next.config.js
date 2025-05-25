/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['qkiczfexutrjascushhd.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qkiczfexutrjascushhd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig