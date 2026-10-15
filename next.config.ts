import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for small Docker images.
  output: "standalone",
  images: {
    // Google is the only source of a photoUrl today, and it serves avatars from
    // lh3 through lh6, so the subdomain is wildcarded and the domain is not:
    // allowing any host would make the optimizer an open image proxy.
    remotePatterns: [{ protocol: "https", hostname: "**.googleusercontent.com" }],
  },
};

export default nextConfig;
