/** @type {import('next').NextConfig} */
const nextConfig = {
  // StrictMode render twice... https://github.com/vercel/next.js/issues/35822
  reactStrictMode: false,
  webpack: function (config, options) {
    if (!options.isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
};

module.exports = nextConfig;
