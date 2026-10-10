import { Types } from 'mongoose';
import { sprintsService } from '../../../../src/modules/projects/sprints.service';
import { SprintModel } from '../../../../src/modules/projects/sprints.model';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { codeOf } from '../codeOf';
import { missingId, newProject } from './projects.fixtures';
import { asArg } from '../../../mockAs';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** A ticket written straight to the store, on a column id that is not on any board. */
const looseTicket = (projectId: string, title: string, sprintId: string | null = null) =>
  TaskModel.create({
    projectId,
    columnId: new Types.ObjectId(),
    key: `BILL-${title}`,
    title,
    sprintId,
  });

/** Makes the next `findByIdAndUpdate` on sprints come back empty, as if deleted mid-call. */
const vanishOnWrite = () =>
  jest
    .spyOn(SprintModel, 'findByIdAndUpdate')
    .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

afterEach(() => jest.restoreAllMocks());

describe('sprint records', () => {
  it('lists a project’s sprints by planned start', async () => {
    const project = await newProject();
    await sprintsService.createSprint(project.id, { name: 'Later', startsOn: day('2026-07-01') });
    await sprintsService.createSprint(project.id, { name: 'Sooner', startsOn: day('2026-06-01') });

    const names = (await sprintsService.sprints(project.id)).map((sprint) => sprint.name);

    expect(names).toEqual(['Sooner', 'Later']);
  });

  it('updates a sprint’s plan', async () => {
    const project = await newProject();
    const sprint = await sprintsService.createSprint(project.id, { name: 'Sprint 1' });

    const saved = await sprintsService.updateSprint(sprint._id.toHexString(), {
      name: 'Sprint 1',
      goal: 'Ship invoices',
    });

    expect(saved).toMatchObject({ name: 'Sprint 1', goal: 'Ship invoices', state: 'PLANNED' });
  });

  it('answers not found for every action on a sprint that does not exist', async () => {
    const id = missingId();

    expect(await codeOf(sprintsService.updateSprint(id, { name: 'x' }))).toBe('NOT_FOUND');
    expect(await codeOf(sprintsService.deleteSprint(id))).toBe('NOT_FOUND');
    expect(await codeOf(sprintsService.startSprint(id))).toBe('NOT_FOUND');
    expect(await codeOf(sprintsService.completionPlan(id))).toBe('NOT_FOUND');
    expect(await codeOf(sprintsService.completeSprint(id))).toBe('NOT_FOUND');
  });

  it('answers not found when a sprint is deleted while it is being started', async () => {
    const project = await newProject();
    const sprint = await sprintsService.createSprint(project.id, { name: 'Sprint 1' });
    vanishOnWrite();

    expect(await codeOf(sprintsService.startSprint(sprint._id.toHexString()))).toBe('NOT_FOUND');
  });

  it('answers not found when a sprint is deleted while it is being completed', async () => {
    const project = await newProject();
    const sprint = await sprintsService.createSprint(project.id, { name: 'Sprint 1' });
    vanishOnWrite();

    expect(await codeOf(sprintsService.completeSprint(sprint._id.toHexString()))).toBe('NOT_FOUND');
  });
});

describe('where unfinished work goes', () => {
  it('counts every ticket as unfinished on a board with no columns yet', async () => {
    const project = await newProject();
    const sprint = await sprintsService.createSprint(project.id, { name: 'Sprint 1' });
    const sprintId = sprint._id.toHexString();
    await looseTicket(project.id, 'One', sprintId);
    await looseTicket(project.id, 'Two', sprintId);
    await looseTicket(project.id, 'Elsewhere');

    const plan = await sprintsService.completionPlan(sprintId);

    expect(plan.unfinishedCount).toBe(2);
  });

  it('picks the planned sprint that starts soonest, skipping running and finished ones', async () => {
    const project = await newProject();
    const current = await sprintsService.createSprint(project.id, { name: 'Current' });
    const later = { name: 'Later', startsOn: day('2026-08-01') };
    await sprintsService.createSprint(project.id, later);
    const sooner = await sprintsService.createSprint(project.id, {
      name: 'Sooner',
      startsOn: day('2026-07-01'),
    });
    const running = await sprintsService.createSprint(project.id, {
      name: 'Running',
      startsOn: day('2026-01-01'),
    });
    await SprintModel.updateOne({ _id: running._id }, { state: 'ACTIVE' });

    const plan = await sprintsService.completionPlan(current._id.toHexString());

    expect(plan).toMatchObject({
      unfinishedCount: 0,
      targetSprintId: sooner._id.toHexString(),
      targetSprintName: 'Sooner',
    });
  });

  it('completes a sprint with nothing left over without touching any ticket', async () => {
    const project = await newProject();
    const sprint = await sprintsService.createSprint(project.id, { name: 'Sprint 1' });
    const other = await looseTicket(project.id, 'Unrelated');

    const done = await sprintsService.completeSprint(sprint._id.toHexString());

    expect(done.state).toBe('COMPLETED');
    expect((await TaskModel.findById(other._id).lean())?.sprintId).toBeNull();
  });
});
