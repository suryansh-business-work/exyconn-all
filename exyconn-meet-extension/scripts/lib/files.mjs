import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Every file under `dir`, as forward-slash paths relative to it, sorted. */
export function listFiles(dir) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        found.push(relative(dir, full).split(sep).join('/'));
      }
    }
  };
  walk(dir);
  return found.sort((a, b) => a.localeCompare(b));
}
