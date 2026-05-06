/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  typedRoutes: false,
  trailingSlash: true,
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
