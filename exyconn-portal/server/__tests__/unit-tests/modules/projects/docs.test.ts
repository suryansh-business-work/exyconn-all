import { docsResolvers } from '../../../../src/modules/projects/docs.resolvers';
import { docsService } from '../../../../src/modules/projects/docs.service';
import { DocPageModel } from '../../../../src/modules/projects/docs.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { ctxFor, missingId, newProject, seedMember } from './projects.fixtures';

const { Query, Mutation } = docsResolvers;

/** Titles under one parent (null for the top level), in sidebar order. */
const titlesUnder = async (projectId: string, parentId: string | null) =>
  (await DocPageModel.find({ projectId, parentId }).sort({ order: 1 }).lean()).map((p) => p.title);

/** A project whose documentation space has Guides and Runbooks at the top, Setup in Guides. */
async function space() {
  const { ctx } = await seedMember();
  const project = await newProject();
  const projectId = String(project.id);
  const page = (title: string, parentId?: string) =>
    Mutation.createDocPage(null, { projectId, parentId, title }, ctx);
  const guides = await page('Guides');
  const runbooks = await page('Runbooks');
  const setup = await page('Setup', guides.id);
  return { ctx, projectId, guides, runbooks, setup };
}

describe('reading the documentation space', () => {
  it('lists every page with its references as strings', async () => {
    const { ctx, projectId, guides } = await space();

    const pages = await Query.projectDocPages(null, { projectId }, ctx);

    const setup = pages.find((page) => page.title === 'Setup');
    expect(pages).toHaveLength(3);
    expect(setup).toMatchObject({ projectId, parentId: guides.id });
    expect(pages.find((page) => page.title === 'Guides')?.parentId).toBeNull();
  });

  it('opens one page, and answers not found for one that does not exist', async () => {
    const { ctx, setup } = await space();

    expect(await Query.docPage(null, { id: setup.id }, ctx)).toMatchObject({ title: 'Setup' });
    expect(await codeOf(Query.docPage(null, { id: missingId() }, ctx))).toBe('NOT_FOUND');
  });

  it('refuses somebody without the Projects role', async () => {
    const { projectId } = await space();
    const outsider = ctxFor(missingId(), [ROLES.LEGAL]);

    expect(await codeOf(Query.projectDocPages(null, { projectId }, outsider))).toBe('FORBIDDEN');
  });
});

describe('editing a page', () => {
  it('changes only the title when only a title is sent', async () => {
    const { ctx, setup } = await space();
    await Mutation.updateDocPage(null, { id: setup.id, body: '<p>Install it.</p>' }, ctx);

    const saved = await Mutation.updateDocPage(null, { id: setup.id, title: 'Set-up' }, ctx);

    expect(saved).toMatchObject({ title: 'Set-up', body: '<p>Install it.</p>' });
  });

  it('names the token’s email as the editor when the account has gone', async () => {
    const { setup } = await space();
    const ghost = ctxFor(missingId(), [ROLES.PROJECTS], 'ghost@exyconn.com');

    const saved = await Mutation.updateDocPage(null, { id: setup.id, body: 'x' }, ghost);

    expect(saved.updatedByName).toBe('ghost@exyconn.com');
  });

  it('reads an empty editor name when the token has no email either', async () => {
    const { setup } = await space();
    const ctx: GraphQLContext = {
      user: { id: missingId(), roles: [ROLES.PROJECTS], email: undefined as unknown as string },
    };

    const saved = await Mutation.updateDocPage(null, { id: setup.id, body: 'x' }, ctx);

    expect(saved.updatedByName).toBe('');
  });

  it('refuses an edit from a token without a user id', async () => {
    const { setup } = await space();

    const attempt = Mutation.updateDocPage(null, { id: setup.id, body: 'x' }, ctxFor(''));

    expect(await codeOf(attempt)).toBe('UNAUTHENTICATED');
  });

  it('answers not found when editing or deleting a page that does not exist', async () => {
    const editor = { id: 'u1', name: 'Asha' };

    expect(await codeOf(docsService.updatePage(missingId(), { title: 'x' }, editor))).toBe(
      'NOT_FOUND',
    );
    expect(await codeOf(docsService.deletePage(missingId()))).toBe('NOT_FOUND');
  });
});

describe('moving a page', () => {
  it('moves a page to the top level and closes the gap it leaves', async () => {
    const { ctx, projectId, setup, guides } = await space();

    await Mutation.moveDocPage(null, { id: setup.id, toIndex: 1 }, ctx);

    expect(await titlesUnder(projectId, null)).toEqual(['Guides', 'Setup', 'Runbooks']);
    expect(await titlesUnder(projectId, guides.id)).toEqual([]);
  });

  it('files a top-level page under another', async () => {
    const { ctx, projectId, runbooks, guides } = await space();

    await expect(
      Mutation.moveDocPage(null, { id: runbooks.id, parentId: guides.id, toIndex: 0 }, ctx),
    ).resolves.toBe(true);

    expect(await titlesUnder(projectId, guides.id)).toEqual(['Runbooks', 'Setup']);
    expect(await titlesUnder(projectId, null)).toEqual(['Guides']);
  });

  it('reorders pages under the same parent', async () => {
    const { projectId, runbooks } = await space();

    await docsService.movePage(runbooks.id, null, 0);

    expect(await titlesUnder(projectId, null)).toEqual(['Runbooks', 'Guides']);
  });

  it('answers not found for a page that does not exist', async () => {
    expect(await codeOf(docsService.movePage(missingId(), null, 0))).toBe('NOT_FOUND');
  });
});
