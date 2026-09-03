#!/usr/bin/env node
/**
 * The portal image copies workspace manifests one COPY line at a time, so the
 * install layer stays cached. The cost is that adding a package to the workspace
 * without adding its line here builds an image where pnpm resolves nothing for
 * that filter — and the build fails with "tsc: not found", which points nowhere
 * near the cause. This check compares the two lists so the miss is caught here.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DOCKERFILE = 'docker/portal-app.Dockerfile';
/** Workspace roots the portal image builds from. Server-only trees are excluded on purpose. */
const ROOTS = ['packages', 'exyconn-portal/apps'];

const dockerfile = readFileSync(DOCKERFILE, 'utf8');

const missing = ROOTS.flatMap((root) =>
  readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, 'package.json')))
    .map((entry) => `${root}/${entry.name}`)
    .filter((dir) => !dockerfile.includes(`COPY ${dir}/package.json`)),
);

if (missing.length > 0) {
  console.error(`${DOCKERFILE} does not copy the manifest for:`);
  for (const dir of missing) {
    console.error(`  ${dir}  ->  add: COPY ${dir}/package.json ${dir}/`);
  }
  process.exit(1);
}

console.log(`${DOCKERFILE} copies every workspace manifest.`);
