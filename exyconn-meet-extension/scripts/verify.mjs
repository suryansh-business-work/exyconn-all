/**
 * Checks the built extension before it is packaged: a valid MV3 manifest with only the
 * allowed permissions and every referenced file present, and no eval, remote code, secrets
 * or (in production) plain-http hosts anywhere in the bundle. Exits non-zero on any problem.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles } from './lib/files.mjs';
import { BUILD_INFO, OUT_DIR } from './lib/paths.mjs';
import { bundleErrors, manifestErrors } from './lib/verify-rules.mjs';

const TEXT_FILES = /\.(?:js|html|json|css)$/;

if (!existsSync(join(OUT_DIR, 'manifest.json'))) {
  console.error(`No build found at ${OUT_DIR}. Run a build first.`);
  process.exit(1);
}

const { mode } = JSON.parse(readFileSync(BUILD_INFO, 'utf8'));
const production = mode !== 'development';
const manifest = JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf8'));

const errors = [
  ...manifestErrors(manifest, { exists: (file) => existsSync(join(OUT_DIR, file)), production }),
  ...listFiles(OUT_DIR)
    .filter((file) => TEXT_FILES.test(file))
    .flatMap((file) =>
      bundleErrors(file, readFileSync(join(OUT_DIR, file), 'utf8'), { production }),
    ),
];

if (errors.length > 0) {
  console.error(`Verification failed (${mode}):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}
console.log(
  `Verified ${manifest.name} ${manifest.version} (${mode}): manifest and bundle are clean.`,
);
