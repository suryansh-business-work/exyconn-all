import { Types } from 'mongoose';
import { ticketResolvers } from '../../../../src/modules/projects/ticket.resolvers';
import { env } from '../../../../src/config/env';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { addTicket, boardWithLead, ctxFor, missingId, seedMember } from './projects.fixtures';

const { Task, Query, Mutation } = ticketResolvers;

describe('Task computed fields', () => {
  const projectId = new Types.ObjectId();

  it('hands the project id out as a string', () => {
    expect(Task.projectId({ projectId })).toBe(projectId.toHexString());
  });

  it('reads a row saved before visibility existed as private', () => {
    expect(Task.visibility({ projectId })).toBe('PRIVATE');
    expect(Task.visibility({ projectId, visibility: null })).toBe('PRIVATE');
    expect(Task.visibility({ projectId, visibility: 'PUBLIC' })).toBe('PUBLIC');
  });

  it('gives a link only to a public ticket that has a token', () => {
    const token = 'c'.repeat(64);
    expect(Task.publicUrl({ projectId, visibility: 'PUBLIC', publicToken: token })).toBe(
      `${env.projectShareBaseUrl}/ticket/${token}`,
    );
    expect(Task.publicUrl({ projectId, visibility: 'PUBLIC', publicToken: null })).toBeNull();
    expect(Task.publicUrl({ projectId, visibility: 'PRIVATE', publicToken: token })).toBeNull();
  });
});

describe('ticket queries', () => {
  it('opens a ticket by key, and answers null for a key nobody holds', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank invoice' });

    const found = await Query.taskByKey(null, { key: raised.key.toLowerCase() }, ctx);

    expect(found).toMatchObject({ id: raised.id, columnId: todo.id, title: 'Blank invoice' });
    expect(await Query.taskByKey(null, { key: 'NONE-404' }, ctx)).toBeNull();
  });

  it('lists the project’s columns with string ids', async () => {
    const { ctx, projectId, todo } = await boardWithLead();

    const columns = await Query.projectColumns(null, { projectId }, ctx);

    expect(columns.map((column) => [column.id, column.name])).toEqual([[todo.id, 'To do']]);
  });

  it('refuses somebody without the Projects role', async () => {
    const outsider = ctxFor(missingId(), [ROLES.HR]);

    expect(await codeOf(Query.taskByKey(null, { key: 'X-1' }, outsider))).toBe('FORBIDDEN');
    expect(await codeOf(Query.projectColumns(null, { projectId: missingId() }, outsider))).toBe(
      'FORBIDDEN',
    );
  });

  it('shows a public ticket to anyone holding the link, signed in or not', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank invoice' });
    const shown = await Mutation.setTaskVisibility(
      null,
      { id: raised.id, visibility: 'PUBLIC' },
      ctx,
    );

    const view = await Query.publicTask(null, { token: String(shown.publicToken) });

    expect(view).toMatchObject({ key: raised.key, status: 'To do' });
    expect(await Query.publicTask(null, { token: 'nope' })).toBeNull();
  });
});

describe('ticket mutations', () => {
  it('switches visibility and hands back the serialized ticket', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank invoice' });

    const shown = await Mutation.setTaskVisibility(
      null,
      { id: raised.id, visibility: 'PUBLIC' },
      ctx,
    );

    expect(shown).toMatchObject({ id: raised.id, columnId: todo.id, visibility: 'PUBLIC' });
  });

  it('shares a ticket with or without a note', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank invoice' });
    const { user: dev } = await seedMember('dev@exyconn.com');

    expect(
      await Mutation.shareTask(null, { id: raised.id, recipientIds: [dev.id], note: null }, ctx),
    ).toBe(1);
    expect(
      await Mutation.shareTask(null, { id: raised.id, recipientIds: [dev.id], note: 'Look' }, ctx),
    ).toBe(1);
  });

  it('refuses a viewer without the Projects role', async () => {
    const outsider = ctxFor(missingId(), [ROLES.HR]);

    expect(
      await codeOf(
        Mutation.setTaskVisibility(null, { id: missingId(), visibility: 'PUBLIC' }, outsider),
      ),
    ).toBe('FORBIDDEN');
    expect(
      await codeOf(Mutation.shareTask(null, { id: missingId(), recipientIds: [] }, outsider)),
    ).toBe('FORBIDDEN');
  });
});
