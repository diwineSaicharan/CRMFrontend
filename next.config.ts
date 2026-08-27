import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * /clients and /create used to be `[type]` segments. They are static now —
   * the CRM has one client rung and one create form — so anything still
   * pointing at the old paths (a bookmark, a link in a message) lands here
   * instead of a 404.
   */
  async redirects() {
    return [
      { source: "/clients/:type", destination: "/clients", permanent: false },
      { source: "/create/:type", destination: "/create", permanent: false },
    ];
  },
};

export default nextConfig;
