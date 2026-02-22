/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API calls to the gateway during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
