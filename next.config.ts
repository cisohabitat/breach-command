import type { NextConfig } from "next";

// The game is a static, single-origin client application with no backend and no
// third-party requests, so these headers cost nothing and close the ordinary
// framing, sniffing and referrer-leak gaps on the public deployment.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  // The commit a build came from, shown in a fault's diagnostic so a report can
  // be matched to the code that produced it.
  env: { NEXT_PUBLIC_BUILD_ID: (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local").slice(0, 7) },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
