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

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });

if (result.error || result.status !== 0) {
  console.warn('Could not point git at .githooks — commit hooks will not run.');
}
