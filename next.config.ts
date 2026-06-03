import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  transpilePackages: [
    '@hydra/dna-engine',
    '@hydra/risk-engine',
    '@hydra/listing-gate',
  ],
};

export default nextConfig;
