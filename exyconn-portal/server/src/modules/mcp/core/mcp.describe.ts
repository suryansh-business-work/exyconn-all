import {
  getNamedType,
  isListType,
  isNonNullType,
  isObjectType,
  type GraphQLField,
  type GraphQLOutputType,
} from 'graphql';

type Field = GraphQLField<unknown, unknown>;

/** `CompanyExpense` → `company expense`, as a description reads it. */
export function humanize(typeName: string): string {
  return typeName
    .replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
}

const namedOf = (type: GraphQLOutputType): string => getNamedType(type).name;

const unwrap = (type: GraphQLOutputType): GraphQLOutputType =>
  isNonNullType(type) ? type.ofType : type;

const hasArg = (field: Field, name: string) => field.args.some((arg) => arg.name === name);

/** The record type a paged answer's `rows` hold, or null when the answer is no page. */
function pageRowType(field: Field): string | null {
  const page = getNamedType(field.type);
  if (!isObjectType(page)) return null;
  const rows = page.getFields().rows;
  return rows ? namedOf(rows.type) : null;
}

/** Each convention: the operation's name pattern, and how it reads when the answer fits it. */
const CONVENTIONS: ReadonlyArray<{
  pattern: RegExp;
  describe: (field: Field, subject: string) => string | null;
}> = [
  {
    pattern: /^list(\w+)Paged$/,
    describe: (field) => {
      const row = pageRowType(field);
      if (!row || !hasArg(field, 'input')) return null;
      return `Lists ${humanize(row)} records one page at a time, with the total count. input.page is zero-based; use input.search, input.filters and input.sorts to narrow and order the rows, and input.archived for archived ones. Prefer this over the unpaged list.`;
    },
  },
  {
    pattern: /^list(\w+)Stats$/,
    describe: (field, subject) =>
      namedOf(field.type) === 'TableStats'
        ? `Summary numbers for the ${humanize(subject)} table (the total and per-field counts) without reading the rows.`
        : null,
  },
  {
    pattern: /^list(\w+)$/,
    describe: (field) =>
      isListType(unwrap(field.type)) && field.args.length === 0
        ? `Lists every ${humanize(namedOf(field.type))} record the person can see, unpaged. For a large table use the paged list instead.`
        : null,
  },
  {
    pattern: /^get(\w+)$/,
    describe: (field, subject) =>
      namedOf(field.type) === subject && hasArg(field, 'id')
        ? `Reads one ${humanize(subject)} by its id.`
        : null,
  },
  {
    pattern: /^create(\w+)$/,
    describe: (field, subject) =>
      namedOf(field.type) === subject && hasArg(field, 'input')
        ? `Creates a ${humanize(subject)} from input and returns it.`
        : null,
  },
  {
    pattern: /^update(\w+)$/,
    describe: (field, subject) =>
      namedOf(field.type) === subject && hasArg(field, 'id') && hasArg(field, 'input')
        ? `Saves input over the ${humanize(subject)} with this id and returns it. Read it first (get${subject}) so fields you do not mean to change keep their values.`
        : null,
  },
  {
    pattern: /^delete(\w+)$/,
    describe: (field, subject) =>
      namedOf(field.type) === 'Boolean' && hasArg(field, 'id')
        ? `Deletes the ${humanize(subject)} with this id; it cannot be undone. Confirm with the person first.`
        : null,
  },
];

/**
 * What a standard record operation does, read from its name and confirmed by its answer:
 * `listLeadsPaged`, `listLeadsStats`, `listLeads`, `getLead`, `createLead`, `updateLead` and
 * `deleteLead`. Null for any other operation — those carry their own GraphQL description.
 */
export function conventionDescription(field: Field): string | null {
  for (const { pattern, describe } of CONVENTIONS) {
    const match = pattern.exec(field.name);
    if (match) return describe(field, match[1]);
  }
  return null;
}
