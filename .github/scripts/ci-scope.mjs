#!/usr/bin/env node
/**
 * Decides what a CI run has to check: the workspace packages a change touched, plus every
 * package that depends on them (a change to @exyconn/shell re-checks every portal app; a change
 * to one app checks that app). The website and the tools site get their own yes/no.
 *
 * The change is measured against `main` (the merge base), not the previous push: staging only
 * ever moves towards main, so "everything not yet deployed" is checked on every push, and a run
 * cancelled by a newer push cannot leave a change unchecked.
 *
 * Writes key=value lines to $GITHUB_OUTPUT (stdout when run by hand). CI_SCOPE_ALL=true, a
 * missing main, or a change to anything every package shares checks everything.
 */
import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Files whose change can break any package: install, toolchain, and CI itself. */
const GLOBAL = [
  /^pnpm-lock\.yaml$/,
  /^package\.json$/,
  /^pnpm-workspace\.yaml$/,
  /^tsconfig\.base\.json$/,
  /^\.npmrc$/,
  /^\.github\/workflows\/(ci|workspace-checks)\.yml$/,
  /^\.github\/scripts\/ci-scope\.mjs$/,
];
/** Inputs of the static gates (Docker manifests, workspace imports) outside any package. */
const GATES = [/^docker\//, /^scripts\/check-/, /^\.github\/scripts\/check-/];
/** Packages checked by their own jobs, or that only aggregate others. */
const OWN_JOB = new Set(['exyconn', 'exyconn-portal']);
const SERVER = 'exyconn-portal-server';
const CODEGEN_OWNERS = new Set([SERVER, '@exyconn/shell', '@exyconn/tracker-core']);
const E2E_OWNER = 'exyconn-portal-ui';
const MOBILE = 'exyconn-tracker-mobile';
/** The tools site is an npm project outside the workspace that compiles these from source. */
const TOOLS = [/^exyconn-tools\//, /^packages\/seo\//, /^packages\/chat-widget\//];
const CT_GROUPS = 3;

const sh = (command) => execSync(command, { encoding: 'utf8' }).trim();

/** Every workspace package: its directory, name, scripts and workspace dependencies. */
function workspacePackages() {
  const patterns = readFileSync('pnpm-workspace.yaml', 'utf8')
    .split('\n')
    .map((line) => /^\s*-\s*'?([^']+?)'?\s*$/.exec(line)?.[1])
    .filter(Boolean);
  const dirs = patterns.flatMap((pattern) => {
    if (!pattern.endsWith('/*')) {
      return [pattern];
    }
    const parent = pattern.slice(0, -2);
    return readdirSync(parent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(parent, entry.name));
  });
  return dirs
    .filter((dir) => existsSync(join(dir, 'package.json')))
    .map((dir) => {
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      const deps = { ...manifest.dependencies, ...manifest.devDependencies };
      return {
        dir,
        name: manifest.name,
        scripts: manifest.scripts ?? {},
        uses: Object.keys(deps).filter((dep) => String(deps[dep]).startsWith('workspace:')),
      };
    });
}

/** The changed files since main, or null when main cannot be compared against. */
function changedFiles() {
  if (process.env.CI_SCOPE_ALL === 'true') {
    return null;
  }
  try {
    const base = sh('git merge-base HEAD origin/main');
    return sh(`git diff --name-only ${base} HEAD`).split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

/** The package that owns `file`: the one with the longest directory prefix. */
function ownerOf(file, packages) {
  return packages
    .filter((pkg) => file.startsWith(`${pkg.dir}/`))
    .sort((a, b) => b.dir.length - a.dir.length)[0];
}

/** `names` plus everything that depends on them, directly or not. */
function withDependents(names, packages) {
  const affected = new Set(names);
  let grew = true;
  while (grew) {
    grew = false;
    for (const pkg of packages) {
      if (!affected.has(pkg.name) && pkg.uses.some((dep) => affected.has(dep))) {
        affected.add(pkg.name);
        grew = true;
      }
    }
  }
  return affected;
}

/** Splits the Cypress packages into groups of about the same number of specs, one job each. */
function ctGroups(packages) {
  const specs = (dir) =>
    Number(sh(`find ${dir}/src -name '*.cy.ts' -o -name '*.cy.tsx' 2>/dev/null | wc -l`));
  const weighted = packages
    .map((pkg) => ({ name: pkg.name, weight: specs(pkg.dir) }))
    .filter((pkg) => pkg.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const groups = Array.from({ length: Math.min(CT_GROUPS, weighted.length) }, () => ({
    weight: 0,
    names: [],
  }));
  for (const pkg of weighted) {
    const lightest = groups.reduce((min, group) => (group.weight < min.weight ? group : min));
    lightest.weight += pkg.weight;
    lightest.names.push(pkg.name);
  }
  return groups.map((group, index) => ({
    id: index + 1,
    filter: group.names.map((name) => `--filter=${name}`).join(' '),
  }));
}

const packages = workspacePackages();
const files = changedFiles();
const everything = files === null || files.some((file) => GLOBAL.some((re) => re.test(file)));
const touched = everything
  ? packages.map((pkg) => pkg.name)
  : files.map((file) => ownerOf(file, packages)?.name).filter(Boolean);
const affected = withDependents(touched, packages);
const checked = packages.filter((pkg) => affected.has(pkg.name) && !OWN_JOB.has(pkg.name));
const names = new Set(checked.map((pkg) => pkg.name));
const filterOf = (list) => list.map((pkg) => `--filter=${pkg.name}`).join(' ');
const unit = checked.filter((pkg) => pkg.name !== SERVER && pkg.scripts.test);
const groups = ctGroups(checked.filter((pkg) => pkg.scripts['test:ct']));
const gates = everything || files.some((file) => GATES.some((re) => re.test(file)));

const outputs = {
  filter: filterOf(checked),
  'test-filter': filterOf(unit),
  checks: String(checked.length > 0 || gates),
  server: String(names.has(SERVER)),
  codegen: String([...CODEGEN_OWNERS].some((name) => names.has(name))),
  mobile: String(names.has(MOBILE)),
  'ct-groups': JSON.stringify(groups),
  e2e: String(names.has(E2E_OWNER)),
  website: String(affected.has('exyconn')),
  tools: String(everything || files.some((file) => TOOLS.some((re) => re.test(file)))),
};

const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
console.log(everything ? 'Scope: everything' : `Scope: ${files.length} changed file(s)`);
console.log(lines.join('\n'));
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}
