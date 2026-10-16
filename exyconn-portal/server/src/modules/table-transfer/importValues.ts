import {
  getNamedType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  type GraphQLEnumType,
  type GraphQLNamedType,
  type GraphQLOutputType,
  type GraphQLInputObjectType,
  type GraphQLInputType,
} from 'graphql';

/** What kind of value a column takes, so the wizard and the template can say so. */
export type FieldKind = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM' | 'LIST' | 'OBJECT';

/** One field of a module's create input, as a column a file may fill. */
export interface ImportField {
  field: string;
  required: boolean;
  kind: FieldKind;
  /** The accepted values of an enum (or a list of one); empty otherwise. */
  options: string[];
  description: string | null;
}

/** Why a cell could not be read; reported against its row, never thrown past the importer. */
export class CellError extends Error {}

const NUMBER_SCALARS: ReadonlySet<string> = new Set(['Int', 'Float']);
const DATE_SCALARS: ReadonlySet<string> = new Set(['DateTime', 'Date']);
const OBJECT_SCALARS: ReadonlySet<string> = new Set(['JSON']);
const TRUE_TEXT: ReadonlySet<string> = new Set(['true', 'yes', 'y', '1']);
const FALSE_TEXT: ReadonlySet<string> = new Set(['false', 'no', 'n', '0']);
/** A list cell's items: `a; b` or `a, b`, the way exports write them. */
const LIST_SEPARATOR = /[;,]/;
const ENUM_SPACING = /[\s-]+/g;

function withoutNonNull(type: GraphQLInputType): GraphQLInputType {
  return isNonNullType(type) ? type.ofType : type;
}

/** The kind of a named type: a scalar's own, an enum, or an object read as JSON. */
export function namedKind(named: GraphQLNamedType): FieldKind {
  if (isInputObjectType(named) || isObjectType(named) || OBJECT_SCALARS.has(named.name)) {
    return 'OBJECT';
  }
  if (isEnumType(named)) {
    return 'ENUM';
  }
  if (NUMBER_SCALARS.has(named.name)) {
    return 'NUMBER';
  }
  if (named.name === 'Boolean') {
    return 'BOOLEAN';
  }
  return DATE_SCALARS.has(named.name) ? 'DATE' : 'TEXT';
}

/** The kind of a field's type, input or output: a list, else its named type's kind. */
export function typeKind(type: GraphQLInputType | GraphQLOutputType): FieldKind {
  const inner = isNonNullType(type) ? type.ofType : type;
  return isListType(inner) ? 'LIST' : namedKind(getNamedType(inner));
}

/** The values an enum field (or a list of one) accepts; empty for any other type. */
export function enumOptions(type: GraphQLInputType | GraphQLOutputType): string[] {
  const named = getNamedType(type);
  return isEnumType(named) ? named.getValues().map((value) => value.name) : [];
}

/** The input's fields as importable columns; deprecated fields are left out. */
export function describeFields(input: GraphQLInputObjectType): ImportField[] {
  return Object.values(input.getFields())
    .filter((field) => !field.deprecationReason)
    .map((field) => ({
      field: field.name,
      required: isNonNullType(field.type) && field.defaultValue === undefined,
      kind: typeKind(field.type),
      options: enumOptions(field.type),
      description: field.description ?? null,
    }));
}

function enumValue(type: GraphQLEnumType, text: string): string {
  const wanted = text.trim().toUpperCase().replaceAll(ENUM_SPACING, '_');
  const names = type.getValues().map((value) => value.name);
  if (!names.includes(wanted)) {
    throw new CellError(`must be one of ${names.join(', ')}`);
  }
  return wanted;
}

function numberValue(scalar: string, text: string): number {
  const value = Number(text);
  if (text.trim() === '' || !Number.isFinite(value)) {
    throw new CellError('must be a number');
  }
  if (scalar === 'Int' && !Number.isInteger(value)) {
    throw new CellError('must be a whole number');
  }
  return value;
}

function booleanValue(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (TRUE_TEXT.has(lower)) {
    return true;
  }
  if (FALSE_TEXT.has(lower)) {
    return false;
  }
  throw new CellError('must be yes or no');
}

function jsonValue(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new CellError('must be JSON');
  }
}

/** Reads a cell's text as a value of the field's GraphQL type; the type itself is validated later. */
export function cellValue(type: GraphQLInputType, text: string): unknown {
  const inner = withoutNonNull(type);
  if (isListType(inner)) {
    return text
      .split(LIST_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item !== '')
      .map((item) => cellValue(inner.ofType, item));
  }
  const named = getNamedType(inner);
  const kind = namedKind(named);
  if (kind === 'OBJECT') {
    return jsonValue(text);
  }
  if (isEnumType(named)) {
    return enumValue(named, text);
  }
  if (kind === 'NUMBER') {
    return numberValue(named.name, text);
  }
  return kind === 'BOOLEAN' ? booleanValue(text) : text;
}

/**
 * A mapped row as the module's input: each known, non-blank cell read as its field's type.
 * Columns the input does not have are ignored; a cell that cannot be read throws a
 * {@link CellError} naming its field.
 */
export function rowInput(
  input: GraphQLInputObjectType,
  cells: Readonly<Record<string, string>>,
): Record<string, unknown> {
  const fields = input.getFields();
  const value: Record<string, unknown> = {};
  for (const [name, text] of Object.entries(cells)) {
    const field = fields[name];
    if (field && text.trim() !== '') {
      try {
        value[name] = cellValue(field.type, text.trim());
      } catch (error) {
        throw new CellError(`${name} ${(error as Error).message}`);
      }
    }
  }
  return value;
}
