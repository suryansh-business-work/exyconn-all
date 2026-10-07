import { Kind, type DocumentNode } from 'graphql';
import { trainingResolvers, trainingTypeDefs } from '../../../../src/modules/training';
import { TRAINING_STATUSES } from '../../../../src/modules/training/training.model';

const enumValues = (doc: DocumentNode, name: string): string[] =>
  doc.definitions.flatMap((definition) =>
    definition.kind === Kind.ENUM_TYPE_DEFINITION && definition.name.value === name
      ? (definition.values ?? []).map((value) => value.name.value)
      : [],
  );

/** The field names a document declares on Query or Mutation. */
const operationFields = (doc: DocumentNode, type: 'Query' | 'Mutation'): string[] =>
  doc.definitions.flatMap((definition) => {
    const isObject =
      definition.kind === Kind.OBJECT_TYPE_DEFINITION ||
      definition.kind === Kind.OBJECT_TYPE_EXTENSION;
    if (isObject && definition.name.value === type) {
      return (definition.fields ?? []).map((field) => field.name.value);
    }
    return [];
  });

const sorted = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b));

describe('training schema', () => {
  it('offers exactly the statuses the model accepts', () => {
    expect(enumValues(trainingTypeDefs, 'TrainingStatus')).toEqual([...TRAINING_STATUSES]);
  });

  it('declares a resolver for every query and mutation, and nothing undeclared', () => {
    expect(sorted(Object.keys(trainingResolvers.Query))).toEqual(
      sorted(operationFields(trainingTypeDefs, 'Query')),
    );
    expect(sorted(Object.keys(trainingResolvers.Mutation))).toEqual(
      sorted(operationFields(trainingTypeDefs, 'Mutation')),
    );
  });
});
