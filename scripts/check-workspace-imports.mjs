#!/usr/bin/env node
/**
 * Every `@exyconn/*` a package imports must be inside its own install closure.
 *
 * The portal image installs one app at a time — `pnpm install --frozen-lockfile --filter
 * "<app>..."` — which fetches the app and everything it TRANSITIVELY depends on, and nothing
 * else. The Vite/TS config then aliases `@exyconn/*` straight at each package's `src`, so an
 * import resolves whether or not the package was installed. The two facts together are the
 * trap: the import resolves, the package's own `node_modules` does not exist, and the build
 * dies inside that package's sources with "Cannot find module 'react'" — naming files the
 * author never touched, twenty minutes into a deploy.
 *
 * That is exactly how portal-support blocked production: it imported @exyconn/crud, nothing in
 * its closure declared crud, so crud's dependencies were never installed. CI never saw it,
 * because CI installs the whole workspace.
 *
 * Transitive is the right test, not "declared directly": a portal reaches @exyconn/ui through
 * @exyconn/shell, and that is genuinely installed.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Workspace roots the portal image builds from. */
const ROOTS = ['packages', 'exyconn-portal/apps'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts']);
/** `from '@exyconn/shell/components/ui'` -> `@exyconn/shell`. */
const IMPORT_PATTERN = /from\s+["'](@exyconn\/[a-z0-9-]+)(?:\/[^"']*)?["']/g;

/** Every workspace package: name -> { dir, deps }. */
function readWorkspace() {
  const packages = new Map();
  for (const root of ROOTS.filter((dir) => existsSync(dir))) {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      const dir = join(root, entry.name);
      const manifestPath = join(dir, 'package.json');
      if (!entry.isDirectory() || !existsSync(manifestPath)) {
        continue;
      }
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      packages.set(manifest.name, {
        dir,
        manifestPath,
        deps: Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }),
      });
    }
  }
  return packages;
}

/** What `--filter "<name>..."` installs: the package plus everything it transitively needs. */
function closureOf(name, packages) {
  const seen = new Set([name]);
  const queue = [name];
  while (queue.length > 0) {
    const current = packages.get(queue.pop());
    for (const dep of current?.deps ?? []) {
      if (packages.has(dep) && !seen.has(dep)) {
        seen.add(dep);
        queue.push(dep);
      }
    }
  }
  return seen;
}

/** Source files under a directory, skipping node_modules. */
function sourceFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : sourceFiles(path);
    }
    const dot = entry.name.lastIndexOf('.');
    return dot > 0 && SOURCE_EXTENSIONS.has(entry.name.slice(dot)) ? [path] : [];
  });
}

/** The `@exyconn/*` packages a package's own sources import, and one file that does it. */
function importsOf(packageDir) {
  const found = new Map();
  for (const file of sourceFiles(join(packageDir, 'src'))) {
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT_PATTERN)) {
      if (!found.has(match[1])) {
        found.set(match[1], file);
      }
    }
  }
  return found;
}

const packages = readWorkspace();
const problems = [];

for (const [name, meta] of packages) {
  const closure = closureOf(name, packages);
  for (const [imported, file] of importsOf(meta.dir)) {
    if (!closure.has(imported)) {
      problems.push({ name, imported, file, manifestPath: meta.manifestPath });
    }
  }
}

if (problems.length > 0) {
  console.error('Workspace imports that the deploy image will not install:\n');
  for (const problem of problems) {
    console.error(`  ${problem.name} imports ${problem.imported}`);
    console.error(`     ${problem.file}`);
    console.error(`     -> add "${problem.imported}": "workspace:*" to ${problem.manifestPath}\n`);
  }
  console.error(
    'These resolve everywhere except the deploy image, which installs only each app’s\n' +
      'transitive closure — so the failure lands on main, after merge.',
  );
  process.exit(1);
}

console.log(`Every @exyconn/* import is inside its package's install closure (${packages.size} packages).`);
