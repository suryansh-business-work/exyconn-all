import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { MODULES } from '../../src/config/modules';
import { moduleNavTree, navPaths } from '../../src/layout/PortalLayout/moduleNav';

/**
 * A sidebar entry whose path no app routes is a link that opens nothing. It is
 * invisible in review — the entry and the route live in different packages — so
 * it is asserted here instead, by reading the nav config and every app's routes.
 */
const REPO_ROOT = join(__dirname, '../../../..');
const APPS = join(REPO_ROOT, 'exyconn-portal/apps');
/** The shell routes a few pages into every app, so they count as routed too. */
const SHELL_ROUTES = join(REPO_ROOT, 'packages/shell/src/app/PortalApp.tsx');

/**
 * Every page the sidebar links to (a branch only opens its pages), each with the route that
 * must exist for it: a scoped module's page (`scopedPrefix`) is routed inside its scope, by
 * the path relative to the module (`/website/pages` → `pages` under /website/s/:siteSlug).
 */
function navLinks(): { path: string; scopedRoute?: string }[] {
  return MODULES.flatMap((module) =>
    navPaths(moduleNavTree(module)).map((path) => ({
      path,
      scopedRoute: module.scopedPrefix ? path.slice(module.path.length + 1) : undefined,
    })),
  );
}

/** Every `path=` a file routes (nested ones relative), with optional/dynamic segments stripped. */
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
    const orphans = navLinks()
      .filter(({ path, scopedRoute }) => !routed.has(path) && !routed.has(scopedRoute ?? path))
      .map(({ path }) => path);
    expect(orphans).toEqual([]);
  });

  it('gives each module app at least one route', () => {
    const empty = apps.filter(
      (app) => existsSync(join(APPS, app, 'src/App.tsx')) && routedPaths(app).length === 0,
    );
    expect(empty).toEqual([]);
  });
});
