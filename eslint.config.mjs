import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Without a config in the project, eslint walks up the filesystem and picks up
// whatever it finds above the repo, which is not reproducible on another
// machine. eslint-config-next 16 ships flat configs directly, so no FlatCompat.
const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
