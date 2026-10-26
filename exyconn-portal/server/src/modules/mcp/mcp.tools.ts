import {
  getNamedType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
  Kind,
  type DocumentNode,
  type GraphQLArgument,
  type GraphQLField,
  type GraphQLInputType,
  type GraphQLNamedType,
  type GraphQLOutputType,
  type GraphQLSchema,
} from 'graphql';

export type ToolKind = 'QUERY' | 'MUTATION';

/** A JSON Schema, as MCP describes a tool's input. */
export type JsonSchema = Record<string, unknown>;

/** One module operation offered to Claude as a tool. */
export interface McpTool {
  /** The GraphQL field's own name — `searchLeads`, `createDeal`… */
  name: string;
  kind: ToolKind;
  description: string;
  inputSchema: JsonSchema;
  /** The arguments in brief, for the tool list in the MCP portal. */
  args: Array<{ name: string; type: string; required: boolean; description: string }>;
  /** The operation the tool runs, with a variable per argument and the fields it returns. */
  document: string;
}

/** Root fields a set of typeDefs declares, by operation. */
export interface DeclaredFields {
  query: Set<string>;
  mutation: Set<string>;
}

/** How deep a tool's answer reaches into nested objects. */
const SELECTION_DEPTH = 2;
/** The most fields one object in an answer selects. */
const MAX_FIELDS_PER_OBJECT = 40;
/** How deep an input object's JSON Schema is spelled out before it is just "an object". */
const MAX_INPUT_DEPTH = 6;
/**
 * Credentials and connection settings are the install's or the company's configuration, not a
 * module's work: they are left out of the tools however a module's typeDefs grow.
 */
const EXCLUDED = /Config|Secret|Token/;

const SCALARS: Readonly<Record<string, JsonSchema>> = {
  String: { type: 'string' },
  ID: { type: 'string' },
  Int: { type: 'integer' },
  Float: { type: 'number' },
  Boolean: { type: 'boolean' },
  DateTime: { type: 'string', format: 'date-time' },
  JSON: {},
};

/** The Query and Mutation fields the given typeDefs declare (definitions and extensions alike). */
export function declaredFields(typeDefs: readonly DocumentNode[]): DeclaredFields {
  const declared: DeclaredFields = { query: new Set(), mutation: new Set() };
  for (const doc of typeDefs) {
    for (const definition of doc.definitions) {
      const isObject =
        definition.kind === Kind.OBJECT_TYPE_DEFINITION ||
        definition.kind === Kind.OBJECT_TYPE_EXTENSION;
      if (!isObject) continue;
      const bucket = rootBucket(declared, definition.name.value);
      for (const field of definition.fields ?? []) {
        bucket?.add(field.name.value);
      }
    }
  }
  return declared;
}

function rootBucket(declared: DeclaredFields, typeName: string): Set<string> | null {
  if (typeName === 'Query') return declared.query;
  if (typeName === 'Mutation') return declared.mutation;
  return null;
}

/** The JSON Schema of a GraphQL input type, nullable unless the type says otherwise. */
export function inputSchemaOf(type: GraphQLInputType, depth = 0): JsonSchema {
  if (isNonNullType(type)) {
    return inputSchemaOf(type.ofType, depth);
  }
  if (isListType(type)) {
    return { type: 'array', items: inputSchemaOf(type.ofType, depth) };
  }
  if (isEnumType(type)) {
    return { type: 'string', enum: type.getValues().map((value) => value.name) };
  }
  if (isInputObjectType(type)) {
    if (depth >= MAX_INPUT_DEPTH) {
      return { type: 'object' };
    }
    const fields = Object.values(type.getFields());
    return {
      type: 'object',
      properties: Object.fromEntries(
        fields.map((field) => [field.name, describe(inputSchemaOf(field.type, depth + 1), field)]),
      ),
      required: fields.filter(isRequired).map((field) => field.name),
      additionalProperties: false,
    };
  }
  return SCALARS[type.name] ?? { type: 'string', description: `A ${type.name} value` };
}

const isRequired = (arg: { type: GraphQLInputType; defaultValue?: unknown }) =>
  isNonNullType(arg.type) && arg.defaultValue === undefined;

function describe(schema: JsonSchema, from: { description?: string | null }): JsonSchema {
  return from.description ? { ...schema, description: from.description } : schema;
}

/** A tool's input: one property per argument, the non-null ones without a default required. */
export function argumentsSchema(args: readonly GraphQLArgument[]): JsonSchema {
  return {
    type: 'object',
    properties: Object.fromEntries(
      args.map((arg) => [arg.name, describe(inputSchemaOf(arg.type), arg)]),
    ),
    required: args.filter(isRequired).map((arg) => arg.name),
    additionalProperties: false,
  };
}

const isLeaf = (type: GraphQLNamedType) => isScalarType(type) || isEnumType(type);

/** The fields of an object worth asking for: none that need an argument, the id first. */
function selectableFields(type: GraphQLNamedType): GraphQLField<unknown, unknown>[] {
  if (!isObjectType(type) && !isInterfaceType(type)) return [];
  return Object.values(type.getFields())
    .filter((field) => field.args.every((arg) => !isRequired(arg)))
    .sort((a, b) => Number(b.name === 'id') - Number(a.name === 'id'))
    .slice(0, MAX_FIELDS_PER_OBJECT);
}

/**
 * The selection set a tool's answer is read with: every scalar and enum field of the returned
 * object, and nested objects down to `depth` levels. Empty for a scalar answer.
 */
export function selectionOf(type: GraphQLOutputType, depth = SELECTION_DEPTH): string {
  const named = getNamedType(type);
  if (isLeaf(named)) {
    return '';
  }
  if (isUnionType(named)) {
    const members = named
      .getTypes()
      .map((member) => {
        const inner = selectionOf(member, depth);
        return inner ? `... on ${member.name} { ${inner} }` : '';
      })
      .filter(Boolean);
    return ['__typename', ...members].join(' ');
  }
  const parts = selectableFields(named).map((field) => fieldSelection(field, depth));
  return parts.filter(Boolean).join(' ') || '__typename';
}

function fieldSelection(field: GraphQLField<unknown, unknown>, depth: number): string {
  if (isLeaf(getNamedType(field.type))) {
    return field.name;
  }
  if (depth <= 1) {
    return '';
  }
  const inner = selectionOf(field.type, depth - 1);
  return inner ? `${field.name} { ${inner} }` : '';
}

/** The operation a tool runs: a variable per argument, the field, and what it returns. */
export function documentOf(kind: ToolKind, field: GraphQLField<unknown, unknown>): string {
  const variables = field.args.map((arg) => `$${arg.name}: ${String(arg.type)}`).join(', ');
  const args = field.args.map((arg) => `${arg.name}: $${arg.name}`).join(', ');
  const selection = selectionOf(field.type);
  const head = variables ? `${kind.toLowerCase()} McpTool(${variables})` : kind.toLowerCase();
  const call = args ? `${field.name}(${args})` : field.name;
  return `${head} { ${call}${selection ? ` { ${selection} }` : ''} }`;
}

function toolOf(kind: ToolKind, field: GraphQLField<unknown, unknown>, label: string): McpTool {
  const verb = kind === 'QUERY' ? 'Reads' : 'Changes';
  const summary = field.description?.trim() || `${verb} ${label} data (${field.name}).`;
  const access = kind === 'QUERY' ? 'read' : 'write';
  return {
    name: field.name,
    kind,
    description: `${summary}\n\n${label} ${access}: runs as the signed-in person, with their own permissions.`,
    inputSchema: argumentsSchema(field.args),
    args: field.args.map((arg) => ({
      name: arg.name,
      type: String(arg.type),
      required: isRequired(arg),
      description: arg.description ?? '',
    })),
    document: documentOf(kind, field),
  };
}

/**
 * Every operation a module declares, as a tool — built from the live schema at boot, so a field
 * added to the module's typeDefs is a tool on the next deploy with nothing else to change.
 * `label` names the module in each tool's description ("CRM", "Marketing").
 */
export function moduleTools(
  schema: GraphQLSchema,
  declared: DeclaredFields,
  label: string,
): McpTool[] {
  const pick = (
    kind: ToolKind,
    root: ReturnType<GraphQLSchema['getQueryType']>,
    names: Set<string>,
  ) =>
    Object.values(root?.getFields() ?? {})
      .filter((field) => names.has(field.name) && !EXCLUDED.test(field.name))
      .map((field) => toolOf(kind, field, label));
  return [
    ...pick('QUERY', schema.getQueryType(), declared.query),
    ...pick('MUTATION', schema.getMutationType(), declared.mutation),
  ].sort((a, b) => a.name.localeCompare(b.name));
}
