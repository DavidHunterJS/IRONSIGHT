import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

// ESLint 9 flat config.
//
// The repo shipped eslint-config-next in devDependencies but no config file, so
// `npm run lint` failed before this. eslint-config-next v16 exports flat config
// arrays directly — FlatCompat is not needed and in fact breaks on this version.
export default [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'public/**'],
  },
];
