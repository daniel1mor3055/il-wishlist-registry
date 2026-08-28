import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product images come from each chain's own Shopify CDN, which is what a
      // real integration would serve. Per D22 the catalog data itself is a
      // local snapshot; only the images are remote.
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Cover photos for the demo registries.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
