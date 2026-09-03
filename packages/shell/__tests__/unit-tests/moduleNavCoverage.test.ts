import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A sidebar entry whose path no app routes is a link that opens nothing. It is
 * invisible in review — the entry and the route live in different packages — so
 * it is asserted here instead, by reading the nav config and every app's routes.
 */
const REPO_ROOT = join(__dirname, '../../../..');
const MODULES = join(REPO_ROOT, 'packages/shell/src/config/modules.ts');
const APPS = join(REPO_ROOT, 'exyconn-portal/apps');
/** The shell routes a few pages into every app, so they count as routed too. */
const SHELL_ROUTES = join(REPO_ROOT, 'packages/shell/src/app/PortalApp.tsx');

/** Every `path:` declared in the nav config, module or child. */
function declaredNavPaths(): string[] {
  const source = readFileSync(MODULES, 'utf8');
  return [...source.matchAll(/path: '(\/[^']*)'/g)].map((match) => match[1]);
}

/** Every `path=` a file routes, with optional/dynamic segments stripped. */
function pathsIn(file: string): string[] {
  if (!existsSync(file)) {
    return [];
  }
  return [...readFileSync(file, 'utf8').matchAll(/path="([^"]+)"/g)].map((match) =>
    match[1].replaceAll(/\/:[^/]+\??/g, ''),
  );
}

function routedPaths(app: string): string[] {
  return pathsIn(join(APPS, app, 'src/App.tsx'));
}

describe('module navigation', () => {
  const apps = readdirSync(APPS);
  const routed = new Set([...apps.flatMap(routedPaths), ...pathsIn(SHELL_ROUTES)]);

  it('routes every path the sidebar offers', () => {
    const orphans = declaredNavPaths().filter((path) => !routed.has(path));
    expect(orphans).toEqual([]);
  });

  it('gives each module app at least one route', () => {
    const empty = apps.filter(
      (app) => existsSync(join(APPS, app, 'src/App.tsx')) && routedPaths(app).length === 0,
    );
    expect(empty).toEqual([]);
  });
});
