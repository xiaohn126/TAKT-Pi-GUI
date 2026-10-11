// Use the published production configuration without installing TypeScript at launch.
const config = require('./.next/required-server-files.json').config;
module.exports = {
  distDir: '.next',
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  images: config.images,
  env: config.env,
  serverExternalPackages: config.serverExternalPackages,
  experimental: { proxyClientMaxBodySize: config.experimental.proxyClientMaxBodySize },
};
