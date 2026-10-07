import { print } from 'graphql';
import * as projects from '../../../../src/modules/projects';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';

describe('project keys', () => {
  it('falls back to PROJ for a name with no letters or digits, and keeps it unique', async () => {
    const first = await ProjectModel.create({ name: '!!!', status: 'ACTIVE' });
    const second = await ProjectModel.create({ name: '???', status: 'ACTIVE' });

    expect(first.key).toBe('PROJ');
    expect(second.key).toBe('PROJ2');
  });

  it('keeps a key it was given, in capitals, instead of deriving one', async () => {
    const created = await ProjectModel.create({ name: 'Billing', status: 'ACTIVE', key: 'inv' });

    expect(created.key).toBe('INV');
  });

  it('starts every project at ticket zero', async () => {
    const created = await ProjectModel.create({ name: 'Billing', status: 'ACTIVE' });

    expect(created.ticketCounter).toBe(0);
    expect(created.status).toBe('ACTIVE');
  });
});

describe('the projects module surface', () => {
  it('exposes a schema for every part of the module', () => {
    const typeDefs = [
      projects.projectsTypeDefs,
      projects.boardTypeDefs,
      projects.docsTypeDefs,
      projects.sprintsTypeDefs,
      projects.shareTypeDefs,
      projects.projectHealthTypeDefs,
    ].map((doc) => print(doc));

    expect(typeDefs.join('\n')).toEqual(expect.stringContaining('type Project '));
    expect(typeDefs[1]).toContain('moveTask');
    expect(typeDefs[3]).toContain('completeSprint');
    expect(typeDefs[4]).toContain('sharedProject');
    expect(typeDefs[5]).toContain('projectHealthOverview');
  });

  it('exposes resolvers for every part of the module', () => {
    expect(Object.keys(projects.projectsResolvers.Mutation)).toEqual(
      expect.arrayContaining(['createProject', 'updateProject', 'deleteProject']),
    );
    expect(projects.boardResolvers.Query.projectBoard).toEqual(expect.any(Function));
    expect(projects.docsResolvers.Query.docPage).toEqual(expect.any(Function));
    expect(projects.sprintsResolvers.Mutation.startSprint).toEqual(expect.any(Function));
    expect(projects.shareResolvers.Query.sharedProject).toEqual(expect.any(Function));
    expect(projects.projectHealthResolvers.Query.projectHealth).toEqual(expect.any(Function));
  });

  it('reads a stored client name as is', () => {
    expect(projects.projectsResolvers.Project.clientName({ clientName: 'Acme' })).toBe('Acme');
  });
});
