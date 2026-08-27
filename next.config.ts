import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * /clients and /create used to be `[type]` segments guarding a single valid
   * value. Old links still land somewhere sensible.
   *
   * These cannot be wildcards: both routes are catch-alls now, so a wildcard
   * redirect would swallow every client id and every create type. Only the
   * rungs that actually existed are listed.
   */
  async redirects() {
    return [
      { source: "/clients/users", destination: "/clients", permanent: false },
      { source: "/clients/dl", destination: "/clients", permanent: false },
      { source: "/clients/super", destination: "/clients", permanent: false },
      { source: "/clients/master", destination: "/clients", permanent: false },
      { source: "/clients/teammates", destination: "/clients", permanent: false },
    ];
  },
};

export default nextConfig;
