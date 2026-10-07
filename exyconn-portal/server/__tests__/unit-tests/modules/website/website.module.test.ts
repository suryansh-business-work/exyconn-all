import { Kind, type DocumentNode } from 'graphql';
import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { websiteResolvers, websiteTypeDefs } from '../../../../src/modules/website';
import {
  BlogPostModel,
  CaseStudyModel,
  GigModel,
  JobCompanyModel,
} from '../../../../src/modules/website/models';
import { ADMIN_EMAIL, customerEditorCtx } from './website.fixtures';

type Resolver = (parent: unknown, args: unknown, ctx: GraphQLContext) => Promise<unknown>;
const Q = websiteResolvers.Query as unknown as Record<string, Resolver>;
const M = websiteResolvers.Mutation as unknown as Record<string, Resolver>;

/** The field names the website documents declare on Query or Mutation. */
const operationFields = (docs: DocumentNode[], type: 'Query' | 'Mutation'): string[] =>
  docs.flatMap((doc) =>
    doc.definitions.flatMap((definition) => {
      const isObject =
        definition.kind === Kind.OBJECT_TYPE_DEFINITION ||
        definition.kind === Kind.OBJECT_TYPE_EXTENSION;
      if (isObject && definition.name.value === type) {
        return (definition.fields ?? []).map((field) => field.name.value);
      }
      return [];
    }),
  );

/** A platform administrator who also holds the website role the content guards ask for. */
const platformEditorCtx = (): GraphQLContext => ({
  user: {
    id: String(new Types.ObjectId()),
    roles: [ROLES.SUPER_ADMIN, ROLES.WEBSITE],
    email: ADMIN_EMAIL,
  },
});

const sorted = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b));

describe('the website schema', () => {
  it('has a resolver for every query and mutation, and no resolver without one', () => {
    expect(sorted(operationFields(websiteTypeDefs, 'Query'))).toEqual(
      sorted(Object.keys(websiteResolvers.Query)),
    );
    expect(sorted(operationFields(websiteTypeDefs, 'Mutation'))).toEqual(
      sorted(Object.keys(websiteResolvers.Mutation)),
    );
  });
});

describe('editing exyconn.com content', () => {
  const input = { slug: 'launch', title: 'Launch', publishedAt: new Date().toISOString() };

  it('lets the platform write and read a post', async () => {
    const created = (await M.createBlogPost(null, { input }, platformEditorCtx())) as {
      id: string;
    };

    const listed = (await Q.listBlogPosts(null, {}, platformEditorCtx())) as Array<{ id: string }>;
    expect(listed.map((row) => row.id)).toEqual([created.id]);
  });

  it('refuses a website editor of a customer company, before anything is written', async () => {
    const ctx = customerEditorCtx();

    await expect(M.createBlogPost(null, { input }, ctx)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
    await expect(Q.listBlogPosts(null, {}, ctx)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
    expect(await BlogPostModel.countDocuments()).toBe(0);
  });

  it('keeps the public reads open to anybody', async () => {
    await BlogPostModel.create({ slug: 'open', title: 'Open', publishedAt: new Date(0) });

    const rows = (await Q.publicBlogPosts(null, {}, { user: null })) as Array<{ slug: string }>;

    expect(rows.map((row) => row.slug)).toEqual(['open']);
  });
});

describe('public lists with no website named', () => {
  it('serve the records filed under no site when the site is null', async () => {
    const publishedAt = new Date(0);
    await BlogPostModel.create({ slug: 'post', title: 'Post', publishedAt });
    await CaseStudyModel.create({ slug: 'study', title: 'Study', publishedAt });
    await JobCompanyModel.create({ companyCode: 'ACME', slug: 'acme', name: 'Acme' });
    await GigModel.create({
      gigCode: 'GIG-1',
      title: 'Logo',
      category: 'Design',
      duration: '< 1 week',
      applicationContact: 'gigs@exyconn.test',
    });

    for (const query of [
      'publicBlogPosts',
      'publicCaseStudies',
      'publicJobCompanies',
      'publicGigs',
    ]) {
      const named = (await Q[query](null, { site: null }, { user: null })) as unknown[];
      expect(named).toHaveLength(1);
    }
  });
});
