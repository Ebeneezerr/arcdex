const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  transpilePackages: [
    '@hydra/dna-engine',
    '@hydra/risk-engine',
    '@hydra/listing-gate',
  ],
};

module.exports = nextConfig;
