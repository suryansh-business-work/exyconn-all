#!/usr/bin/env node
/**
 * Points git at the repository's own hooks directory.
 *
 * Runs from the root `prepare` script, which pnpm executes on every install — including
 * the installs inside `docker/*.Dockerfile`. Those run on `node:22-alpine`, which ships
 * no git and is not a git checkout, so shelling straight out to `git config` failed with
 * `sh: git: not found` and took the whole install, and with it every portal image, down
 * with it. There are no hooks to install in an image anyway.
 *
 * So: install the hooks where there is a checkout to install them into, and say nothing
 * anywhere else. Exits 0 either way — a developer machine that cannot configure hooks is
 * worth a warning, never a failed install.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('.git')) {
  process.exit(0);
}

// Fixed install locations only: a bare `git` would be resolved through PATH.
const GIT_LOCATIONS = [
  '/usr/bin/git',
  '/usr/local/bin/git',
  '/opt/homebrew/bin/git',
  String.raw`C:\Program Files\Git\cmd\git.exe`,
];
const git = GIT_LOCATIONS.find((location) => existsSync(location));
const result = git
  ? spawnSync(git, ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' })
  : undefined;

if (!result || result.error || result.status !== 0) {
  console.warn('Could not point git at .githooks — commit hooks will not run.');
}
