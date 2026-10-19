import { workflowsResolvers } from '../../../../src/modules/projects/workflows.resolvers';
import { workflowsService } from '../../../../src/modules/projects/workflows.service';
import { ProjectWorkflowModel } from '../../../../src/modules/projects/workflows.model';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { ctxFor, missingId, seedMember } from './projects.fixtures';

const { ProjectWorkflow, Query, Mutation } = workflowsResolvers;
const actor = { id: 'u1', name: 'Asha' };

/** Start → Build → End, as the editor would send it. */
const graph = () => ({
  nodes: [
    { key: 'start', kind: 'START', label: 'Start', x: 0, y: 0 },
    { key: 'build', kind: 'STEP', label: '  Build ', x: 0, y: 120 },
    { key: 'end', kind: 'END', label: 'Done', x: 0, y: 240 },
  ],
  edges: [
    { key: 'e1', source: 'start', target: 'build', label: '' },
    { key: 'e2', source: 'build', target: 'end', label: 'Shipped' },
  ],
});

describe('workflowsService details', () => {
  it('opens a new workflow on a Start joined to an End, with trimmed details', async () => {
    const created = await workflowsService.create(
      { name: '  Release  ', description: '  How we ship ' },
      actor,
    );

    expect(created).toMatchObject({
      name: 'Release',
      description: 'How we ship',
      createdByName: 'Asha',
      updatedByName: 'Asha',
    });
    expect(created.nodes.map((n) => n.kind)).toEqual(['START', 'END']);
    expect(created.edges.map((e) => [e.source, e.target])).toEqual([['start', 'end']]);
  });

  it('stores an empty description when none is given', async () => {
    const created = await workflowsService.create({ name: 'Intake', description: null }, actor);
    const again = await workflowsService.create({ name: 'Triage' }, actor);

    expect(created.description).toBe('');
    expect(again.description).toBe('');
  });

  it.each([
    ['a blank name', { name: '   ' }],
    ['a name over 120 characters', { name: 'x'.repeat(121) }],
    ['a description over 1000 characters', { name: 'Ok', description: 'x'.repeat(1001) }],
  ])('refuses %s', async (_label, input) => {
    expect(await codeOf(workflowsService.create(input, actor))).toBe('BAD_USER_INPUT');
    expect(await ProjectWorkflowModel.countDocuments()).toBe(0);
  });

  it('takes a name of exactly 120 characters and a description of exactly 1000', async () => {
    const created = await workflowsService.create(
      { name: 'x'.repeat(120), description: 'y'.repeat(1000) },
      actor,
    );

    expect(created.name).toHaveLength(120);
  });

  it('renames a workflow and records who did', async () => {
    const created = await workflowsService.create({ name: 'Release' }, actor);

    const renamed = await workflowsService.updateDetails(
      created._id.toHexString(),
      { name: 'Hotfix' },
      { id: 'u2', name: 'Ben' },
    );

    expect(renamed).toMatchObject({ name: 'Hotfix', createdByName: 'Asha', updatedByName: 'Ben' });
  });

  it('answers not found for a workflow that is not there', async () => {
    expect(await codeOf(workflowsService.get(missingId()))).toBe('NOT_FOUND');
    expect(await codeOf(workflowsService.updateDetails(missingId(), { name: 'X' }, actor))).toBe(
      'NOT_FOUND',
    );
    expect(await codeOf(workflowsService.remove(missingId()))).toBe('NOT_FOUND');
  });
});

describe('workflowsService.saveGraph', () => {
  it('replaces the drawing whole', async () => {
    const created = await workflowsService.create({ name: 'Release' }, actor);
    const id = created._id.toHexString();

    const saved = await workflowsService.saveGraph(id, graph(), { id: 'u2', name: 'Ben' });

    expect(saved.nodes.map((n) => n.label)).toEqual(['Start', 'Build', 'Done']);
    expect(saved.edges.map((e) => e.label)).toEqual(['', 'Shipped']);
    expect(saved.updatedByName).toBe('Ben');
  });

  it('refuses a graph that cannot be read, with the first problem found', async () => {
    const created = await workflowsService.create({ name: 'Release' }, actor);
    const broken = graph();
    broken.nodes[1].label = '';

    await expect(
      workflowsService.saveGraph(created._id.toHexString(), broken, actor),
    ).rejects.toThrow('Every step needs a name');
    await expect(
      workflowsService.saveGraph(created._id.toHexString(), 'not a graph', actor),
    ).rejects.toThrow();
  });

  it('refuses a graph that breaks a workflow rule, and keeps the old drawing', async () => {
    const created = await workflowsService.create({ name: 'Release' }, actor);
    const looped = graph();
    looped.edges.push({ key: 'e3', source: 'end', target: 'build', label: '' });

    await expect(
      workflowsService.saveGraph(created._id.toHexString(), looped, actor),
    ).rejects.toThrow('Nothing can follow an End');
    const kept = await workflowsService.get(created._id.toHexString());
    expect(kept.nodes).toHaveLength(2);
  });

  it('answers not found for a sound graph on a workflow that is not there', async () => {
    expect(await codeOf(workflowsService.saveGraph(missingId(), graph(), actor))).toBe('NOT_FOUND');
  });
});

describe('workflowsResolvers', () => {
  it('runs the whole life of a workflow for a Projects user', async () => {
    const { ctx } = await seedMember();

    const created = await Mutation.createProjectWorkflow(null, { input: { name: 'Release' } }, ctx);
    expect(created).toMatchObject({ name: 'Release', createdByName: 'lead' });

    await Mutation.updateProjectWorkflow(
      null,
      { id: created.id, input: { name: 'Release v2', description: 'Weekly' } },
      ctx,
    );
    const saved = await Mutation.saveProjectWorkflowGraph(
      null,
      { id: created.id, graph: graph() },
      ctx,
    );
    expect(saved.nodes).toHaveLength(3);

    const listed = await Query.projectWorkflows(null, {}, ctx);
    expect(listed.map((row) => [row.id, row.name])).toEqual([[created.id, 'Release v2']]);
    expect(ProjectWorkflow.nodes(listed[0])).toEqual([]);
    expect(ProjectWorkflow.edges(listed[0])).toEqual([]);

    const opened = await Query.projectWorkflow(null, { id: created.id }, ctx);
    expect(ProjectWorkflow.nodes(opened)).toHaveLength(3);
    expect(ProjectWorkflow.edges(opened)).toHaveLength(2);

    expect(await Mutation.deleteProjectWorkflow(null, { id: created.id }, ctx)).toBe(true);
    expect(await ProjectWorkflowModel.countDocuments()).toBe(0);
  });

  it('refuses somebody without the Projects role', async () => {
    const outsider = ctxFor(missingId(), [ROLES.HR]);

    expect(await codeOf(Query.projectWorkflows(null, {}, outsider))).toBe('FORBIDDEN');
    expect(
      await codeOf(Mutation.createProjectWorkflow(null, { input: { name: 'X' } }, outsider)),
    ).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.deleteProjectWorkflow(null, { id: missingId() }, outsider))).toBe(
      'FORBIDDEN',
    );
  });
});
