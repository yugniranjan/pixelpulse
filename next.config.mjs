/** @type {import('next').NextConfig} */

const nextConfig = {
  async redirects() {
    return [
      {
        source: "/st-catharines",
        destination: "/",
        permanent: true,
      },
      {
        source: "/st-catharines/:path*",
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
    NEXT_PUBLIC_API_URL: "https://apis-351216.nn.r.appspot.com/api",
    NEXT_PUBLIC_BASE_URL: "https://www.pixelpulseplay.ca",
  },
};

export default nextConfig;
