import { projectsResolvers } from '../../src/modules/projects';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asProjects: GraphQLContext = {
  user: { id: 'lead-1', roles: [ROLES.PROJECTS], email: 'lead@exyconn.com' },
};

interface SavedProject {
  id: string;
  clientId: string | null;
  clientName: string;
  budgetAmount: number | null;
  budgetHours: number | null;
}

const seedClient = (name: string) =>
  ClientModel.create({
    name,
    email: `${name.toLowerCase()}@acme.test`,
    phone: '000',
    company: 'Acme',
    status: 'ACTIVE',
  });

const create = (input: Record<string, unknown>) =>
  projectsResolvers.Mutation.createProject(
    null,
    { input: { name: 'Billing', status: 'ACTIVE', ...input } } as never,
    asProjects,
  ) as Promise<SavedProject>;

const update = (id: string, input: Record<string, unknown>) =>
  projectsResolvers.Mutation.updateProject(
    null,
    { id, input: { name: 'Billing', status: 'ACTIVE', ...input } } as never,
    asProjects,
  ) as Promise<SavedProject>;

describe('project client', () => {
  it('writes the client name next to its id', async () => {
    const client = await seedClient('Priya');

    const saved = await create({ clientId: String(client._id) });

    expect(saved).toMatchObject({ clientId: String(client._id), clientName: 'Priya' });
  });

  it('refreshes the name when the project is moved to another client', async () => {
    const first = await seedClient('Priya');
    const second = await seedClient('Rahul');
    const saved = await create({ clientId: String(first._id) });

    const moved = await update(saved.id, { clientId: String(second._id) });

    expect(moved.clientName).toBe('Rahul');
  });

  it('allows a project with no client at all', async () => {
    const saved = await create({ clientId: null });

    expect(saved.clientName).toBe('');
  });

  it('refuses a client that does not exist', async () => {
    await expect(create({ clientId: '64b7f9c2f1a2b3c4d5e6f7a8' })).rejects.toThrow(
      /client does not exist/i,
    );
  });

  it('reads an empty name for a project written before the field existed', async () => {
    const legacy = await ProjectModel.create({ name: 'Old', status: 'ACTIVE' });
    await ProjectModel.updateOne({ _id: legacy._id }, { $unset: { clientName: 1 } });

    const read = (await projectsResolvers.Query.getProject(
      null,
      { id: legacy.id } as never,
      asProjects,
    )) as { clientName?: string };

    expect(projectsResolvers.Project.clientName(read)).toBe('');
  });
});

describe('project budget', () => {
  it('stores the agreed money and hours, and leaves both null when none was set', async () => {
    const budgeted = await create({ budgetAmount: 250_000, budgetHours: 120 });
    const open = await create({ name: 'Unbudgeted' });

    expect(budgeted).toMatchObject({ budgetAmount: 250_000, budgetHours: 120 });
    expect(open).toMatchObject({ budgetAmount: null, budgetHours: null });
  });
});
