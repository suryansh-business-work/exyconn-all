#!/usr/bin/env node
/**
 * Parses every module's SDL the way the running server does, then BUILDS it.
 *
 * A bad `typeDefs` block is a runtime parse error, not a type error, so tsc says
 * nothing and every server test fails at once with the same message — the schema
 * never built, so nothing could. This turns that into one line naming the file.
 *
 * Parsing each file on its own is not enough. Two modules can each be perfectly
 * valid and still be impossible together: a duplicate `type Policy`, a field
 * whose description was orphaned when the field above it was deleted, an input
 * referring to an enum nobody declares any more. Every one of those parses
 * cleanly per file and kills the server on boot, so the merged schema is built
 * here too.
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
const serverRequire = createRequire(resolve(SERVER, "package.json"));
const { parse, buildSchema } = serverRequire("graphql");

let parsed = 0;
const failures = [];
/** Every module's SDL, kept so the merged schema can be built once at the end. */
const documents = [];

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
    const sdl = new Function(`return \`${block[1]}\``)();
    parse(sdl);
    documents.push(sdl);
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

// The base schema declares Query/Mutation and the scalars every module extends.
const base = readFileSync(join(SERVER, "src/graphql/base.typeDefs.ts"), "utf8");
const baseBlock = /gql`([\s\S]*?)`;/.exec(base);

try {
  // graphql-js resolves `extend type Query` against the base declaration when both are in
  // one document, which is exactly what the server ends up with after Apollo merges them.
  buildSchema(
    [new Function(`return \`${baseBlock[1]}\``)(), ...documents].join("\n"),
  );
} catch (error) {
  console.error(
    "The modules parse individually but do not build into one schema:",
  );
  console.error(`  ${error.message.split("\n")[0]}`);
  console.error(
    "  Usually a type declared twice, a description left behind by a deleted field,",
  );
  console.error(
    "  or a type referenced after the module that declared it was changed.",
  );
  process.exit(1);
}

console.log(
  `Every module's GraphQL SDL parses and builds (${parsed} documents).`,
);
