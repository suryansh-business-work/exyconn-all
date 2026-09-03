#!/usr/bin/env node
/**
 * Parses every module's SDL the way the running server does.
 *
 * A bad `typeDefs` block is a runtime parse error, not a type error, so tsc says
 * nothing and every server test fails at once with the same message — the schema
 * never built, so nothing could. This turns that into one line naming the file.
 *
 * The SDL is read out of the `gql` template and evaluated as a template literal,
 * because the escapes a description contains resolve in JS before GraphQL ever
 * sees them: `\"` in the source is a plain quote to the parser, and a quote
 * inside a description ends it early.
 */
const { createRequire } = require("node:module");
const { readFileSync, readdirSync } = require("node:fs");
const { join, resolve } = require("node:path");

const SERVER = "exyconn-portal/server";
const ROOT = join(SERVER, "src/modules");

// pnpm keeps graphql in the server package, not at the workspace root.
const { parse } = createRequire(resolve(SERVER, "package.json"))("graphql");

let parsed = 0;
const failures = [];

for (const entry of readdirSync(ROOT, { recursive: true })) {
  const name = String(entry);
  if (!name.endsWith("typeDefs.ts")) {
    continue;
  }
  const file = join(ROOT, name);
  const block = /gql`([\s\S]*?)`;/.exec(readFileSync(file, "utf8"));
  if (!block) {
    continue;
  }
  parsed += 1;
  try {
    parse(new Function(`return \`${block[1]}\``)());
  } catch (error) {
    failures.push(`${file}\n    ${error.message.split("\n")[0]}`);
  }
}

if (failures.length > 0) {
  console.error("GraphQL SDL does not parse:");
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(`Every module's GraphQL SDL parses (${parsed} documents).`);
