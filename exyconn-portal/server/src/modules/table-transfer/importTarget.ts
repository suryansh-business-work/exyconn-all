import {
  getNamedType,
  isInputObjectType,
  isObjectType,
  type GraphQLField,
  type GraphQLInputObjectType,
  type GraphQLSchema,
} from 'graphql';
import { describeFields, type ImportField } from './importValues';
import { registeredTable } from './registry';
import { listTarget, type ListTarget } from './tableSchema';

/** A mutation an import writes through, as the source of its operation. */
export interface ImportWrite {
  /** The mutation field, e.g. `createClient`. */
  name: string;
  input: GraphQLInputObjectType;
  /** The operation's variable definitions, typed as the mutation declares its arguments. */
  variables: string;
  /** The argument list passing those variables. */
  args: string;
  /** `{ __typename }` for a record result; empty for a scalar one. */
  selection: string;
}

export interface ImportTarget extends ListTarget {
  create: ImportWrite;
  /** Absent when the module has no `update<Name>(id, input)`: only CREATE is offered. */
  update: ImportWrite | null;
  /** Fields that identify a record, readable on the row and fillable from a file. */
  matchFields: string[];
  fields: ImportField[];
}

/** Describes a mutation that takes `input` (and `id` when `needsId`), or null when it does not. */
function writeOf(
  field: GraphQLField<unknown, unknown> | undefined,
  needsId: boolean,
): ImportWrite | null {
  const inputArg = field?.args.find((arg) => arg.name === 'input');
  const input = inputArg ? getNamedType(inputArg.type) : undefined;
  const idArg = field?.args.find((arg) => arg.name === 'id');
  if (!field || !inputArg || !isInputObjectType(input) || (needsId && !idArg)) {
    return null;
  }
  const passed = needsId && idArg ? [idArg, inputArg] : [inputArg];
  return {
    name: field.name,
    input,
    variables: passed.map((arg) => `$${arg.name}: ${String(arg.type)}`).join(', '),
    args: passed.map((arg) => `${arg.name}: $${arg.name}`).join(', '),
    selection: isObjectType(getNamedType(field.type)) ? '{ __typename }' : '',
  };
}

/** The import side of a paged list, or null when the list takes no import. */
export function importTarget(schema: GraphQLSchema, list: string): ImportTarget | null {
  const registered = registeredTable(list)?.matchFields;
  if (!registered) {
    return null;
  }
  const target = listTarget(schema, list);
  const mutations = schema.getMutationType()?.getFields() ?? {};
  const create = writeOf(mutations[`create${target.entity}`], false);
  if (!create) {
    return null;
  }
  const update = writeOf(mutations[`update${target.entity}`], true);
  const rowFields = target.rowType.getFields();
  const inputFields = create.input.getFields();
  const matchFields = update
    ? registered.filter((field) => field in rowFields && field in inputFields && 'id' in rowFields)
    : [];
  return { ...target, create, update, matchFields, fields: describeFields(create.input) };
}
