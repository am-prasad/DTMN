/** @type {import('next').NextConfig} */
const nextConfig = {
  // C5 (CSRF): In production, leave NEXT_PUBLIC_API_URL unset so the browser
  // uses relative /api/v1/* paths (same-origin → SameSite=Lax cookies work).
  // The rewrite below proxies those to the backend.
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Local development
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      // M11: Remove hardcoded **.onrender.com — add your production domain below
      // {
      //   protocol: "https",
      //   hostname: "api.yourdomain.com",
      //   pathname: "/uploads/**",
      // },
    ],
  },

  // Security headers (M5)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // C5: Tell browsers not to cache credentials for cross-origin requests
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
