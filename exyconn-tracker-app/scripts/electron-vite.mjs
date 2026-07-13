import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Launches electron-vite with a clean environment.
 *
 * VS Code (and other Electron hosts, including some CI shells) export
 * ELECTRON_RUN_AS_NODE=1 into their integrated terminals. That flag makes the Electron
 * binary boot as plain Node, so `require('electron')` returns a path string instead of the
 * API and the app crashes at the first `app.*` call. Stripping it here means `pnpm dev`
 * works from any terminal without the caller having to unset it.
 */
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const command = process.argv[2] ?? 'dev';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-vite.cmd' : 'electron-vite');

const child = spawn(bin, [command], { stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
