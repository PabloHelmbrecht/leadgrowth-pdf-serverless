/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium-min","handlebars"],
    appDir: true,
  },

};

export default nextConfig;
