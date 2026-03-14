import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: "hypercopy",
  project: "hypercopy-web",
  silent: !process.env.CI,
  // Upload source maps for better stack traces
  widenClientFileUpload: true,
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Tree-shakes Sentry logger statements
  disableLogger: true,
  // Automatically instruments API routes and server components
  automaticVercelMonitors: false,
});