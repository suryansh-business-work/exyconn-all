#!/usr/bin/env node
/**
 * The portal image copies workspace manifests one COPY line at a time, so the
 * install layer stays cached. The cost is that adding a package to the workspace
 * without adding its line here builds an image where pnpm resolves nothing for
 * that filter — and the build fails with "tsc: not found", which points nowhere
 * near the cause. This check compares the two lists so the miss is caught here.
 *
 * The website image copies only the workspace packages the site builds from. Its build
 * reads each package's source AND the tsconfig it extends (`@exyconn/config`), so a package
 * reached through any dependency — dev ones included — needs both its manifest and its
 * source copied. Missing one kept production on an old build for three deploys, because
 * nothing before `deploy.yml` builds that image.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PORTAL_DOCKERFILE = 'docker/portal-app.Dockerfile';
/** Workspace roots the portal image builds from. Server-only trees are excluded on purpose. */
const ROOTS = ['packages', 'exyconn-portal/apps'];

const WEBSITE_DOCKERFILE = 'docker/website.Dockerfile';
const WEBSITE_DIR = 'exyconn-website';

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function portalMisses() {
  const dockerfile = readFileSync(PORTAL_DOCKERFILE, 'utf8');
  return ROOTS.flatMap((root) =>
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, 'package.json')))
      .map((entry) => `${root}/${entry.name}`)
      .filter((dir) => !dockerfile.includes(`COPY ${dir}/package.json`))
      .map((dir) => `${PORTAL_DOCKERFILE}: add  COPY ${dir}/package.json ${dir}/`),
  );
}

/** `@exyconn/*` name → its directory under packages/. */
function workspacePackages() {
  const byName = new Map();
  for (const entry of readdirSync('packages', { withFileTypes: true })) {
    const manifest = join('packages', entry.name, 'package.json');
    if (entry.isDirectory() && existsSync(manifest)) {
      byName.set(readJson(manifest).name, join('packages', entry.name));
    }
  }
  return byName;
}

function workspaceDepsOf(manifest, byName) {
  const deps = { ...manifest.dependencies, ...manifest.devDependencies };
  return Object.keys(deps).filter((name) => byName.has(name));
}

/** Every workspace package the website reaches, through any kind of dependency. */
function websiteClosure(byName) {
  const reached = new Set();
  const queue = workspaceDepsOf(readJson(join(WEBSITE_DIR, 'package.json')), byName);
  while (queue.length > 0) {
    const name = queue.shift();
    if (!reached.has(name)) {
      reached.add(name);
      queue.push(...workspaceDepsOf(readJson(join(byName.get(name), 'package.json')), byName));
    }
  }
  return [...reached].map((name) => byName.get(name));
}

function websiteMisses() {
  const dockerfile = readFileSync(WEBSITE_DOCKERFILE, 'utf8');
  return websiteClosure(workspacePackages()).flatMap((dir) => [
    ...(dockerfile.includes(`COPY ${dir}/package.json ${dir}/`)
      ? []
      : [`${WEBSITE_DOCKERFILE}: add  COPY ${dir}/package.json ${dir}/`]),
    ...(dockerfile.includes(`COPY ${dir} ${dir}\n`)
      ? []
      : [`${WEBSITE_DOCKERFILE}: add  COPY ${dir} ${dir}`]),
  ]);
}

const missing = [...portalMisses(), ...websiteMisses()];

if (missing.length > 0) {
  console.error('A Docker image is missing workspace files it builds from:');
  for (const line of missing) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log(
  `${PORTAL_DOCKERFILE} copies every workspace manifest; ${WEBSITE_DOCKERFILE} copies every package the site builds from.`,
);
