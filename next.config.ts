import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * /clients and /create used to be `[type]` segments guarding a single valid
   * value. Old links still land somewhere sensible.
   *
   * /clients/:type cannot be a wildcard any more: /clients/[userId] is a real
   * route now and a wildcard would swallow every client id. Only the rungs
   * that actually existed are listed.
   */
  async redirects() {
    return [
      { source: "/clients/users", destination: "/clients", permanent: false },
      { source: "/clients/dl", destination: "/clients", permanent: false },
      { source: "/clients/super", destination: "/clients", permanent: false },
      { source: "/clients/master", destination: "/clients", permanent: false },
      { source: "/clients/teammates", destination: "/clients", permanent: false },
      { source: "/create/:type", destination: "/create", permanent: false },
    ];
  },
};

export default nextConfig;
