/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/vaughan",
        destination: "/",
        permanent: true,
      },
      {
        source: "/vaughan/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "www.pixelpulseplay.ca",
        port: "",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: "https://websitebackend-439220.ue.r.appspot.com",
    NEXT_PUBLIC_BASE_URL: "https://pixelpulseplay.ca",
  },
};

export default nextConfig;
