const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const process = require('node:process');

const ROOT = path.resolve(__dirname, '..');

/**
 * Each service owns its port in its own config (server env.PORT, vite strictPort,
 * astro.config). The ports below are mirrored only to probe readiness and render the
 * status table — they are never passed as flags, so each port keeps one source of truth.
 */
const SERVICES = [
  {
    name: 'portal-server',
    pkg: 'exyconn-portal-server',
    port: 4004,
    url: 'http://localhost:4004/graphql',
    color: '[36m',
  },
  {
    name: 'portal-ui',
    pkg: 'exyconn-portal-ui',
    port: 4003,
    url: 'http://localhost:4003',
    color: '[35m',
  },
  {
    name: 'website',
    pkg: 'exyconn',
    port: 4000,
    url: 'http://localhost:4000',
    color: '[32m',
  },
];

const RESET = '[0m';
const DIM = '[2m';
const GREEN = '[32m';
const RED = '[31m';

const READY_TIMEOUT_MS = 120_000;
const PROBE_INTERVAL_MS = 500;

const children = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pipeWithPrefix(stream, target, service) {
  stream.on('data', (chunk) => {
    const lines = String(chunk)
      .split('\n')
      .filter((line) => line.trim().length > 0);
    for (const line of lines) {
      target.write(`${service.color}[${service.name}]${RESET} ${line}\n`);
    }
  });
}

function startService(service) {
  const child = spawn('pnpm', ['--filter', service.pkg, 'run', 'dev'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    // Own process group on POSIX so shutdown() can signal the whole tree, not just the shell.
    detached: process.platform !== 'win32',
  });

  pipeWithPrefix(child.stdout, process.stdout, service);
  pipeWithPrefix(child.stderr, process.stderr, service);

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.stderr.write(
        `${service.color}[${service.name}]${RESET} ${RED}exited with code ${code}${RESET}\n`,
      );
    }
  });

  children.push(child);
}

/**
 * Resolves true as soon as something accepts a TCP connection on the port.
 * Connects to `localhost` rather than `127.0.0.1` on purpose: Vite binds to ::1 only,
 * so an IPv4-only probe would report a perfectly healthy portal-ui as "not ready".
 */
function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: 'localhost', port });
    const settle = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.once('connect', () => settle(true));
    socket.once('error', () => settle(false));
    socket.setTimeout(PROBE_INTERVAL_MS, () => settle(false));
  });
}

async function waitForService(service, deadline) {
  while (Date.now() < deadline) {
    if (await isPortOpen(service.port)) {
      return true;
    }
    await delay(PROBE_INTERVAL_MS);
  }
  return false;
}

const HEADERS = ['SERVICE', 'PACKAGE', 'URL', 'PORT', 'STATUS'];

function buildRow(service, ready) {
  return {
    cells: [service.name, service.pkg, service.url, String(service.port), ready ? 'running' : 'not ready'],
    statusColor: ready ? GREEN : RED,
  };
}

function renderTable(rows) {
  const widths = HEADERS.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row.cells[index].length)),
  );

  const rule = (left, mid, right) =>
    `${left}${widths.map((width) => '─'.repeat(width + 2)).join(mid)}${right}`;

  const headerRow = `│ ${HEADERS.map((header, i) => header.padEnd(widths[i])).join(' │ ')} │`;

  const bodyRows = rows.map((row) => {
    const cells = row.cells.map((cell, i) => {
      const padded = cell.padEnd(widths[i]);
      // Colorize only the status cell, after padding, so column widths stay aligned.
      return i === HEADERS.length - 1 ? `${row.statusColor}${padded}${RESET}` : padded;
    });
    return `│ ${cells.join(' │ ')} │`;
  });

  return [rule('┌', '┬', '┐'), headerRow, rule('├', '┼', '┤'), ...bodyRows, rule('└', '┴', '┘')].join(
    '\n',
  );
}

let shuttingDown = false;

/**
 * Each service is spawned through a shell, so `child.kill()` would only kill the shell
 * and leave the dev server holding its port (the next `run:all` then dies on EADDRINUSE).
 * Kill the whole process tree instead.
 */
function killTree(child) {
  if (!child.pid) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  process.kill(-child.pid, 'SIGTERM');
}

function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  process.stdout.write(`\n${DIM}Stopping services…${RESET}\n`);
  for (const child of children) {
    killTree(child);
  }
  process.exit(0);
}

async function main() {
  process.stdout.write(`${DIM}Starting Exyconn portal + website…${RESET}\n\n`);
  SERVICES.forEach(startService);

  const deadline = Date.now() + READY_TIMEOUT_MS;
  const readiness = await Promise.all(SERVICES.map((service) => waitForService(service, deadline)));
  const rows = SERVICES.map((service, index) => buildRow(service, readiness[index]));

  process.stdout.write(`\n${renderTable(rows)}\n\n`);
  process.stdout.write(`${DIM}Press Ctrl+C to stop all services.${RESET}\n\n`);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  process.stderr.write(`${RED}run:all failed: ${error.message}${RESET}\n`);
  shutdown();
});
