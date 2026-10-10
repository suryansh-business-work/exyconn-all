import { Types } from 'mongoose';
import { sprintsService } from '../../../../src/modules/projects/sprints.service';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { codeOf } from '../codeOf';
import { missingId, newProject } from './projects.fixtures';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const ticket = (projectId: string, title: string, extra: Record<string, unknown> = {}) =>
  TaskModel.create({
    projectId,
    columnId: new Types.ObjectId(),
    key: `BILL-${title}`,
    title,
    ...extra,
  });

describe('milestones', () => {
  it('lists a project’s milestones by due date', async () => {
    const project = await newProject();
    await sprintsService.createMilestone(project.id, { name: 'Launch', dueOn: day('2026-09-01') });
    await sprintsService.createMilestone(project.id, { name: 'Beta', dueOn: day('2026-07-01') });

    const names = (await sprintsService.milestones(project.id)).map((one) => one.name);

    expect(names).toEqual(['Beta', 'Launch']);
  });

  it('starts planned and moves to whatever state it is given', async () => {
    const project = await newProject();
    const created = await sprintsService.createMilestone(project.id, { name: 'Launch' });
    expect(created.state).toBe('PLANNED');

    const hit = await sprintsService.updateMilestone(created._id.toHexString(), {
      name: 'Launch',
      state: 'HIT',
    });

    expect(hit.state).toBe('HIT');
  });

  it('frees its tickets when a milestone is deleted, rather than deleting them', async () => {
    const project = await newProject();
    const milestone = await sprintsService.createMilestone(project.id, { name: 'Launch' });
    const milestoneId = milestone._id.toHexString();
    const counted = await ticket(project.id, 'Counted', { milestoneId });

    await expect(sprintsService.deleteMilestone(milestoneId)).resolves.toBe(true);

    expect((await TaskModel.findById(counted._id).lean())?.milestoneId).toBeNull();
  });

  it('answers not found for a milestone that does not exist', async () => {
    const id = missingId();

    expect(await codeOf(sprintsService.updateMilestone(id, { name: 'x' }))).toBe('NOT_FOUND');
    expect(await codeOf(sprintsService.deleteMilestone(id))).toBe('NOT_FOUND');
  });
});

describe('ticket links', () => {
  it('answers not found when putting a missing ticket in a sprint', async () => {
    expect(await codeOf(sprintsService.setTaskSprint(missingId(), null))).toBe('NOT_FOUND');
  });

  it('takes a ticket out of its epic with a null parent', async () => {
    const project = await newProject();
    const epic = await ticket(project.id, 'Epic', { type: 'EPIC' });
    const child = await ticket(project.id, 'Child', { parentTaskId: epic._id.toHexString() });

    const saved = await sprintsService.setTaskParent(child._id.toHexString(), null);

    expect(saved.parentTaskId).toBeNull();
  });

  it('answers not found for an epic that does not exist', async () => {
    const project = await newProject();
    const child = await ticket(project.id, 'Child');

    expect(await codeOf(sprintsService.setTaskParent(child._id.toHexString(), missingId()))).toBe(
      'NOT_FOUND',
    );
  });

  it('answers not found for a ticket that does not exist under a real epic', async () => {
    const project = await newProject();
    const epic = await ticket(project.id, 'Epic', { type: 'EPIC' });

    expect(await codeOf(sprintsService.setTaskParent(missingId(), epic._id.toHexString()))).toBe(
      'NOT_FOUND',
    );
  });
});
