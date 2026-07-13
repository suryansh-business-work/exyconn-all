import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';

function normalize(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (value && typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  }

  return value;
}

export const JSONScalar: GraphQLScalarType = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value) => normalize(value),
  parseValue: (value) => normalize(value),
  parseLiteral: (ast: ValueNode): unknown => {
    switch (ast.kind) {
      case Kind.STRING:
        return normalize(ast.value);
      case Kind.INT:
      case Kind.FLOAT:
        return Number(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.NULL:
        return null;
      case Kind.OBJECT: {
        const value: Record<string, unknown> = {};
        for (const field of ast.fields) {
          value[field.name.value] = JSONScalar.parseLiteral(field.value);
        }
        return value;
      }
      case Kind.LIST: {
        return ast.values.map((value) => JSONScalar.parseLiteral(value));
      }
      default:
        return null;
    }
  },
});
