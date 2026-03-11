import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',          // static export — served by Spring Boot / Nginx
  trailingSlash: true,       // needed for static hosting
  images: {
    unoptimized: true,       // required with output: 'export'
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  },
}

export default nextConfig
