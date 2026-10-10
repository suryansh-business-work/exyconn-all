import { Types } from 'mongoose';
import { trainingResolvers } from '../../../../src/modules/training';
import { TrainingModel } from '../../../../src/modules/training/training.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { freezeClock } from '../../../helpers';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
type Row = {
  id: string;
  employeeId: string;
  title: string;
  status: string;
  completedOn: Date | null;
};

const Query = trainingResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = trainingResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, roles, email: `${id}@exyconn.com` },
});

const hr = as('hr-1', [ROLES.HR]);
const employee = as('emp-1', [ROLES.EMPLOYEE]);

const training = (employeeId: string, title: string, dueOn: Date | null = null) => ({
  employeeId,
  title,
  provider: 'Coursera',
  category: 'Security',
  assignedOn: new Date('2026-09-01T00:00:00.000Z'),
  dueOn,
  status: 'ASSIGNED',
});

afterEach(() => {
  jest.useRealTimers();
});

describe('training records for HR', () => {
  it('assigns a training with no completion or certificate yet', async () => {
    const created = (await Mutation.createTraining(
      null,
      { input: training('emp-1', 'Secure coding') },
      hr,
    )) as Row;

    const saved = await TrainingModel.findById(created.id).lean();
    expect(saved).toMatchObject({
      title: 'Secure coding',
      status: 'ASSIGNED',
      completedOn: null,
      certificateUrl: null,
    });
  });

  it('refuses a status outside the training lifecycle', async () => {
    await expect(
      Mutation.createTraining(
        null,
        { input: { ...training('emp-1', 'Odd'), status: 'SKIPPED' } },
        hr,
      ),
    ).rejects.toThrow();
    expect(await TrainingModel.countDocuments()).toBe(0);
  });

  it('keeps an employee from assigning trainings', async () => {
    await expect(
      Mutation.createTraining(null, { input: training('emp-1', 'Self-assigned') }, employee),
    ).rejects.toThrow('You do not have access to this resource');
  });

  it('pages the register sorted by due date and counts it by status', async () => {
    await TrainingModel.create([
      training('emp-1', 'Later', new Date('2026-12-01T00:00:00.000Z')),
      training('emp-2', 'Sooner', new Date('2026-10-15T00:00:00.000Z')),
      { ...training('emp-3', 'Done'), status: 'COMPLETED' },
    ]);

    const page = (await Query.listTrainingsPaged(
      null,
      {
        input: {
          page: 0,
          pageSize: 10,
          filters: [{ field: 'status', op: 'EQUALS', value: 'ASSIGNED' }],
        },
      },
      hr,
    )) as { rows: Row[]; totalCount: number };
    const stats = (await Query.listTrainingsStats(null, {}, hr)) as {
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
    };

    expect(page.totalCount).toBe(2);
    expect(page.rows.map((row) => row.title)).toEqual(['Sooner', 'Later']);
    expect(stats.counts[0].buckets).toEqual(
      expect.arrayContaining([
        { value: 'ASSIGNED', count: 2 },
        { value: 'COMPLETED', count: 1 },
      ]),
    );
  });
});

describe('an employee and their own trainings', () => {
  it('lists only their own trainings, soonest due first', async () => {
    await TrainingModel.create([
      training('emp-1', 'Second', new Date('2026-11-01T00:00:00.000Z')),
      training('emp-1', 'First', new Date('2026-10-10T00:00:00.000Z')),
      training('emp-2', 'Someone else s course'),
    ]);

    const mine = (await Query.myTrainings(null, {}, employee)) as Row[];

    expect(mine.map((row) => row.title)).toEqual(['First', 'Second']);
    expect(mine.every((row) => row.employeeId === 'emp-1' && typeof row.id === 'string')).toBe(
      true,
    );
  });

  it('stamps the completion date when they complete a training', async () => {
    const own = await TrainingModel.create(training('emp-1', 'Privacy basics'));
    freezeClock('2026-10-05T12:00:00.000Z');

    const updated = (await Mutation.updateMyTrainingStatus(
      null,
      { id: own._id.toHexString(), status: 'COMPLETED' },
      employee,
    )) as Row;

    expect(updated).toMatchObject({ id: own._id.toHexString(), status: 'COMPLETED' });
    expect(updated.completedOn).toEqual(new Date('2026-10-05T12:00:00.000Z'));
    const saved = await TrainingModel.findById(own._id).lean();
    expect(saved?.completedOn).toEqual(new Date('2026-10-05T12:00:00.000Z'));
  });

  it('clears the completion date when a completed training is reopened', async () => {
    const own = await TrainingModel.create({
      ...training('emp-1', 'Privacy basics'),
      status: 'COMPLETED',
      completedOn: new Date('2026-09-20T00:00:00.000Z'),
    });

    const updated = (await Mutation.updateMyTrainingStatus(
      null,
      { id: own._id.toHexString(), status: 'IN_PROGRESS' },
      employee,
    )) as Row;

    expect(updated).toMatchObject({ status: 'IN_PROGRESS', completedOn: null });
  });

  it('cannot move another employee s training', async () => {
    const theirs = await TrainingModel.create(training('emp-2', 'Not mine'));

    await expect(
      Mutation.updateMyTrainingStatus(
        null,
        { id: theirs._id.toHexString(), status: 'COMPLETED' },
        employee,
      ),
    ).rejects.toThrow('Record not found');
    const saved = await TrainingModel.findById(theirs._id).lean();
    expect(saved?.status).toBe('ASSIGNED');
  });

  it('refuses a status the lifecycle does not have', async () => {
    const own = await TrainingModel.create(training('emp-1', 'Privacy basics'));

    await expect(
      Mutation.updateMyTrainingStatus(
        null,
        { id: own._id.toHexString(), status: 'SKIPPED' },
        employee,
      ),
    ).rejects.toThrow();
    const saved = await TrainingModel.findById(own._id).lean();
    expect(saved?.status).toBe('ASSIGNED');
  });

  it('refuses an anonymous request', async () => {
    await expect(Query.myTrainings(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
    await expect(
      Mutation.updateMyTrainingStatus(
        null,
        { id: new Types.ObjectId().toHexString(), status: 'COMPLETED' },
        { user: null },
      ),
    ).rejects.toThrow('Authentication required');
  });
});
