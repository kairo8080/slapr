/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  typedRoutes: true,
  trailingSlash: true,
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
