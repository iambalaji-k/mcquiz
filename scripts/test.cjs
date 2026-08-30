// Cross-platform test runner. Vitest defaults NODE_ENV to "production",
// which makes react load its production CJS build where `act` is stripped,
// breaking @testing-library/react with "React.act is not a function".
// Force the development build for tests.
process.env.NODE_ENV = 'development';
process.env.VITEST = 'true';

const { spawnSync } = require('node:child_process');
const result = spawnSync(
  process.execPath,
  ['--no-deprecation', './node_modules/vitest/vitest.mjs', 'run', ...process.argv.slice(2)],
  { stdio: 'inherit' }
);
process.exit(result.status ?? 1);
