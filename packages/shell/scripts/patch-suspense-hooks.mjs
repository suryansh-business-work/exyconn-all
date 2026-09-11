/**
 * typescript-react-apollo emits each `use…SuspenseQuery` as two overloads preceded by a
 * single `// @ts-ignore`. Under Apollo 4 that is not enough in two places: a `@ts-ignore`
 * only covers the line after it, so the SECOND overload of all 334 queries fails, and for
 * a query with required variables the call the hook body makes is rejected too, because
 * the plugin passes options that Apollo 4 types as possibly missing `variables`.
 *
 * The plugin has no switch for this, so the comment it already intended is completed here.
 * Runs as part of `pnpm codegen`, which keeps the committed output reproducible and the
 * CI drift gate honest.
 */
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../src/graphql/generated/index.ts', import.meta.url);
const SECOND_OVERLOAD = /^export function use\w+SuspenseQuery\(baseOptions\?: \w+\.SkipToken \|.*\): .*;$/;
const SUSPENSE_CALL = /^\s*return \w+\.useSuspenseQuery</;

const lines = (await readFile(FILE, 'utf8')).split('\n');
const patched = [];
let added = 0;

for (const line of lines) {
  if ((SECOND_OVERLOAD.test(line) || SUSPENSE_CALL.test(line)) && patched.at(-1)?.trim() !== '// @ts-ignore') {
    patched.push('// @ts-ignore');
    added += 1;
  }
  patched.push(line);
}

await writeFile(FILE, patched.join('\n'));
console.log(`patch-suspense-hooks: guarded ${added} lines`);
