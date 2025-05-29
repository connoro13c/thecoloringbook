/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
}

module.exports = nextConfig
