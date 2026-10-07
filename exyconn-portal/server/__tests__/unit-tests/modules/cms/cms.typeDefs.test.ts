import { Kind, type DocumentNode } from 'graphql';
import {
  cmsContentResolvers,
  cmsContentTypeDefs,
  cmsPublicResolvers,
  cmsPublicTypeDefs,
  cmsResolvers,
  cmsTypeDefs,
} from '../../../../src/modules/cms';
import {
  CMS_DOCUMENT_STATUSES,
  CMS_FRAGMENT_KINDS,
  CMS_PAGE_KINDS,
  CMS_PAGE_LAYOUTS,
  CMS_SITE_STATUSES,
  SUBSCRIBER_STATUSES,
} from '../../../../src/modules/cms/models';

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

describe('CMS schema enums', () => {
  it('match the values the models accept', () => {
    expect(enumValues(cmsTypeDefs, 'CmsSiteStatus')).toEqual([...CMS_SITE_STATUSES]);
    expect(enumValues(cmsTypeDefs, 'CmsDocumentStatus')).toEqual([...CMS_DOCUMENT_STATUSES]);
    expect(enumValues(cmsTypeDefs, 'CmsPageKind')).toEqual([...CMS_PAGE_KINDS]);
    expect(enumValues(cmsTypeDefs, 'CmsPageLayout')).toEqual([...CMS_PAGE_LAYOUTS]);
    expect(enumValues(cmsTypeDefs, 'CmsFragmentKind')).toEqual([...CMS_FRAGMENT_KINDS]);
    expect(enumValues(cmsContentTypeDefs, 'NewsletterSubscriberStatus')).toEqual([
      ...SUBSCRIBER_STATUSES,
    ]);
  });
});

describe('CMS operations', () => {
  it.each([
    ['website team', cmsTypeDefs, cmsResolvers],
    ['newsletter', cmsContentTypeDefs, cmsContentResolvers],
    ['public', cmsPublicTypeDefs, cmsPublicResolvers],
  ] as const)('the %s schema has a resolver for every operation and no more', (_name, doc, map) => {
    expect(sorted(operationFields(doc, 'Query'))).toEqual(sorted(Object.keys(map.Query)));
    expect(sorted(operationFields(doc, 'Mutation'))).toEqual(sorted(Object.keys(map.Mutation)));
  });
});
