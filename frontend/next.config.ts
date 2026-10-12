import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/v1/* requests to the backend so:
  // (a) the browser only talks to the Next.js origin (same-origin, no CORS needed)
  // (b) SameSite=Lax cookies are sent automatically (C5 CSRF fix)
  // In production leave NEXT_PUBLIC_API_URL unset; the rewrite below handles routing.
  async rewrites() {
    const backendOrigin =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      // local dev
      { protocol: "http", hostname: "localhost", port: "8000" },
      // Add your production domain here, e.g.:
      // { protocol: "https", hostname: "api.yourdomain.com" },
    ],
  },
};

export default nextConfig;
