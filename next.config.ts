import type { NextConfig } from "next";

const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" } : {}),
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1"]
};

export default nextConfig;
