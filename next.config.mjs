/** @type {import('next').NextConfig} */

const nextConfig = {
 async redirects() {
  return [

//     {
//       source: "/brampton",
//       destination: "/oakville",
//       permanent: true,
//     },
//     {
//       source: "/brampton/:slug*",
//       destination: "/oakville",
//       permanent: true,
//     },    
//     {
//       source: "/oakville/programs/summerpass",
//       destination: "/oakville/programs/camps",
//       permanent: true,
//     },
//     {
//       source: '/:city/:path*/kids-birthday-party',
//       destination: '/:city/kids-birthday-party',
//       permanent: true,
//     },
//     {
//       source: "/:path*/about-us/:slug/:mulug",
//       destination: "/:path*/about-us",
//       permanent: true,
//     },
//     {
//       source: "/:path*/aboutus",
//       destination: "/:path*/about-us",
//       permanent: true,
//     },
//     {
//   source: "/:path*/home/",
//   destination: "/:path*/",
//   permanent: true,
// },  
//     {
//       source: "/:path*/aboutus/:slug*",
//       destination: "/:path*/about-us/:slug*",
//       permanent: true,
//     },
//     {
//       source: "/st-catharines/attractions/open-jumps",
//       destination: "/st-catharines/attractions/open-jump",
//       permanent: true,
//     },
//     {
//       source: "/:path*/brampton",
//       destination: "/oakville",
//       permanent: true,
//     },
// 	{
//       source: "/:path*/contact us",
//       destination:  "/:path*/contact-us",
//       permanent: true,
//     },
// 	{
//       source: "/thunderbay/:path*",
//       destination:  "/oakville",
//       permanent: true,
//     }
// 	,
// 	{
//       source: "/st-catharines/glow",
//       destination:  "/st-catharines/programs/glow",
//       permanent: true,
//     },
// 	{
//       source: "/london/summerpass",
//       destination:  "/london/programs/camps",
//       permanent: true,
//     },
	
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
        hostname: "www.aerosportsparks.ca",
        port: "",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: "https://apis-351216.nn.r.appspot.com/api",
    NEXT_PUBLIC_BASE_URL: "https://www.aerosportsparks.ca",
  },
};

export default nextConfig;
