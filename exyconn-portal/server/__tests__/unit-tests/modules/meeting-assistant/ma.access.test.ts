import { Types } from 'mongoose';
import {
  assertMaUser,
  editableMeeting,
  ownedMeeting,
  readableMeeting,
  scopeFilter,
  seesCompany,
} from '../../../../src/modules/meeting-assistant/ma.access';
import { extensionMayRun } from '../../../../src/modules/meeting-assistant/extension.fields';
import { logMaEvent } from '../../../../src/modules/meeting-assistant/events.service';
import {
  maMeetingMutations,
  maMeetingQueries,
} from '../../../../src/modules/meeting-assistant/ma.meeting.resolvers';
import {
  setActionStatus,
  updateAction,
  type ActionInput,
} from '../../../../src/modules/meeting-assistant/actions.service';
import {
  MaActionItemModel,
  MaEventModel,
  MaMeetingModel,
} from '../../../../src/modules/meeting-assistant/models';
import { assertRole } from '../../../../src/middleware/roleGuard';
import { AuditLogModel, auditResolvers } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { codeOf } from '../codeOf';
import { ctxOf, PAGE, seedAccount, seedMeeting, setMaSettings } from './ma.fixtures';
import { useTestOrganization } from '../../../helpers';

// Saved recordings, which deleting a meeting also removes, belong to a company.
useTestOrganization();

let employee: MaActor;
let colleague: MaActor;
let aiUser: MaActor;

beforeEach(async () => {
  employee = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  colleague = await seedAccount('Ravi', [ROLES.EMPLOYEE]);
  aiUser = await seedAccount('Neha', [ROLES.EMPLOYEE, ROLES.AI]);
});

describe('who may use the assistant', () => {
  it('names the actor from their own account', async () => {
    expect(await assertMaUser(ctxOf(employee, [ROLES.EMPLOYEE]))).toEqual(employee);
    expect(await codeOf(assertMaUser({ user: null }))).toBe('UNAUTHENTICATED');
  });

  it('falls back to the token’s email for an account it cannot find', async () => {
    const ghost = { id: new Types.ObjectId().toHexString(), name: '', email: 'ghost@exyconn.com' };

    expect(await assertMaUser(ctxOf(ghost, [ROLES.EMPLOYEE]))).toEqual({
      ...ghost,
      name: 'ghost@exyconn.com',
    });
  });

  it('never lets a failed log write fail the action it describes', async () => {
    await expect(
      logMaEvent({ type: 'x'.repeat(61), message: 'too long a type' }),
    ).resolves.toBeUndefined();

    expect(await MaEventModel.countDocuments()).toBe(0);
  });

  it('refuses everyone when switched off, and anyone outside the allow-list', async () => {
    await setMaSettings({ allowedUserIds: [colleague.id] });
    expect(await codeOf(assertMaUser(ctxOf(employee, [ROLES.EMPLOYEE])))).toBe('FORBIDDEN');
    expect(await codeOf(assertMaUser(ctxOf(colleague, [ROLES.EMPLOYEE])))).toBe('OK');

    await setMaSettings({ enabled: false });
    expect(await codeOf(assertMaUser(ctxOf(colleague, [ROLES.EMPLOYEE])))).toBe('FORBIDDEN');
  });
});

describe('scoping', () => {
  it('confines MINE to the caller and keeps ALL to the AI role and ADMIN', async () => {
    const asEmployee = ctxOf(employee, [ROLES.EMPLOYEE]);

    expect(await scopeFilter(asEmployee, employee, 'MINE')).toEqual({ viewerIds: employee.id });
    expect(await scopeFilter(asEmployee, employee, null)).toEqual({ viewerIds: employee.id });
    expect(await codeOf(scopeFilter(asEmployee, employee, 'ALL'))).toBe('FORBIDDEN');
    expect(await scopeFilter(ctxOf(aiUser, [ROLES.AI]), aiUser, 'ALL')).toEqual({});
    expect(await scopeFilter(ctxOf(employee, [ROLES.ADMIN]), employee, 'ALL')).toEqual({});
  });

  it('never gives an extension token the company view, whatever its roles', async () => {
    expect(await seesCompany(ctxOf(aiUser, [ROLES.ADMIN]))).toBe(true);
    expect(await seesCompany(ctxOf(aiUser, [ROLES.ADMIN], { esid: 'session-1' }))).toBe(false);
    expect(await seesCompany(ctxOf(employee, [ROLES.EMPLOYEE]))).toBe(false);
  });

  it('answers not-found for another person’s meeting, and lets the company view read it', async () => {
    const theirs = await seedMeeting(colleague);
    const id = String(theirs._id);

    expect(await codeOf(readableMeeting(ctxOf(employee, [ROLES.EMPLOYEE]), employee, id))).toBe(
      'NOT_FOUND',
    );
    expect(
      await codeOf(
        readableMeeting(
          ctxOf(employee, [ROLES.EMPLOYEE]),
          employee,
          new Types.ObjectId().toHexString(),
        ),
      ),
    ).toBe('NOT_FOUND');
    expect(await codeOf(ownedMeeting(employee, id))).toBe('NOT_FOUND');
    expect(String((await readableMeeting(ctxOf(aiUser, [ROLES.AI]), aiUser, id))._id)).toBe(id);
  });

  it('lets a matched viewer read but only the owner or a company editor change', async () => {
    const meeting = await seedMeeting(colleague, { viewerIds: [colleague.id, employee.id] });
    const id = String(meeting._id);

    expect(await codeOf(readableMeeting(ctxOf(employee, [ROLES.EMPLOYEE]), employee, id))).toBe(
      'OK',
    );
    expect(await codeOf(editableMeeting(ctxOf(employee, [ROLES.EMPLOYEE]), employee, id))).toBe(
      'FORBIDDEN',
    );
    expect(await codeOf(editableMeeting(ctxOf(colleague, [ROLES.EMPLOYEE]), colleague, id))).toBe(
      'OK',
    );
    expect(await codeOf(editableMeeting(ctxOf(aiUser, [ROLES.AI]), aiUser, id))).toBe('OK');
  });
});

describe('the extension token fence', () => {
  it('runs only the extension’s own root fields', () => {
    expect(
      extensionMayRun('query { maMeeting(id: "1") { id } maNotes(meetingId: "1") { version } }'),
    ).toBe(true);
    expect(extensionMayRun('mutation { maStartSession(input: {}) { id } }')).toBe(true);
    expect(
      extensionMayRun('query { maMeeting(id: "1") { ...M } } fragment M on MaMeeting { id }'),
    ).toBe(true);
    expect(extensionMayRun('query { users { id } }')).toBe(false);
    expect(extensionMayRun('query { maMeeting(id: "1") { id } users { id } }')).toBe(false);
  });

  it('refuses a fragment spread at the root, an unparseable document and no document', () => {
    expect(extensionMayRun('query { ...Root } fragment Root on Query { users { id } }')).toBe(
      false,
    );
    expect(extensionMayRun('query {')).toBe(false);
    expect(extensionMayRun(undefined)).toBe(false);
    expect(extensionMayRun(['query { maMeeting(id: "1") { id } }'])).toBe(false);
  });

  it('is refused by every role guard, even for an administrator', () => {
    const admin = ctxOf(aiUser, [ROLES.ADMIN]);
    expect(assertRole(admin, [ROLES.HR]).id).toBe(aiUser.id);
    expect(() => assertRole(ctxOf(aiUser, [ROLES.ADMIN], { esid: 's1' }), [ROLES.HR])).toThrow(
      'Sign in to the portal to do this.',
    );
  });
});

describe('meeting resolvers', () => {
  const start = (ctx: GraphQLContext) =>
    maMeetingMutations.maStartSession(
      null,
      {
        input: {
          meetingCode: 'abc-defg-hij',
          url: 'https://meet.google.com/abc-defg-hij',
          title: 'Standup',
          timezone: 'UTC',
          startedAt: new Date(),
        },
      },
      ctx,
    );

  it('starts a session, logging it to the audit log and the assistant’s own log', async () => {
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);

    const meeting = await start(ctx);

    expect(meeting).toMatchObject({ meetingCode: 'abc-defg-hij', actionItemCount: 0 });
    expect(
      await AuditLogModel.countDocuments({ actorId: employee.id, module: 'Meeting Assistant' }),
    ).toBe(1);
    expect(
      await MaEventModel.countDocuments({ type: 'SESSION_STARTED', actorId: employee.id }),
    ).toBe(1);
  });

  it('logs the end of a call once, however many times it is finalized', async () => {
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);
    const meeting = await start(ctx);
    const args = { meetingId: meeting.id, endedAt: new Date() };

    await maMeetingMutations.maFinalizeSession(null, args, ctx);
    const again = await maMeetingMutations.maFinalizeSession(null, args, ctx);

    expect(again.status).toBe('ENDED');
    expect(await MaEventModel.countDocuments({ type: 'SESSION_ENDED' })).toBe(1);
    expect(
      await codeOf(
        maMeetingMutations.maFinalizeSession(null, args, ctxOf(colleague, [ROLES.EMPLOYEE])),
      ),
    ).toBe('NOT_FOUND');
  });

  it('lists only the caller’s own meetings unless they hold the company view', async () => {
    await seedMeeting(employee);
    await seedMeeting(colleague);

    const mine = await maMeetingQueries.maMeetingsPaged(
      null,
      { input: PAGE },
      ctxOf(employee, [ROLES.EMPLOYEE]),
    );
    const all = await maMeetingQueries.maMeetingsPaged(
      null,
      { input: PAGE, scope: 'ALL' },
      ctxOf(aiUser, [ROLES.AI]),
    );

    expect(mine.totalCount).toBe(1);
    expect(all.totalCount).toBe(2);
    expect(
      await codeOf(
        maMeetingQueries.maMeetingsPaged(
          null,
          { input: PAGE, scope: 'ALL' },
          ctxOf(employee, [ROLES.EMPLOYEE]),
        ),
      ),
    ).toBe('FORBIDDEN');
  });

  it('confirms a speaker as a colleague, who can then read the meeting', async () => {
    const meeting = await seedMeeting(employee);
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);
    const confirm = (input: { label: string; name: string; userId?: string }) =>
      maMeetingMutations.maConfirmSpeaker(null, { meetingId: String(meeting._id), input }, ctx);

    expect(await codeOf(confirm({ label: ' ', name: 'Ravi' }))).toBe('BAD_USER_INPUT');
    expect(
      await codeOf(
        confirm({ label: 'Speaker A', name: 'Ravi', userId: new Types.ObjectId().toHexString() }),
      ),
    ).toBe('BAD_USER_INPUT');
    await confirm({ label: 'Speaker A', name: 'Someone' });
    const updated = await confirm({ label: 'Speaker A', name: 'Ravi', userId: colleague.id });

    expect(updated.speakerMappings).toEqual([
      expect.objectContaining({ label: 'Speaker A', name: 'Ravi', userId: colleague.id }),
    ]);
    expect(updated.viewerIds).toEqual([employee.id, colleague.id]);
    expect(
      await codeOf(
        readableMeeting(ctxOf(colleague, [ROLES.EMPLOYEE]), colleague, String(meeting._id)),
      ),
    ).toBe('OK');
  });

  it('deletes a meeting with everything recorded for it', async () => {
    const meeting = await seedMeeting(employee);
    await MaEventModel.create({ meetingId: String(meeting._id), type: 'X', message: 'x' });

    await maMeetingMutations.maDeleteMeeting(
      null,
      { id: String(meeting._id) },
      ctxOf(employee, [ROLES.EMPLOYEE]),
    );

    expect(await MaMeetingModel.countDocuments()).toBe(0);
    expect(await MaEventModel.countDocuments({ meetingId: String(meeting._id) })).toBe(0);
  });
});

describe('action items edited by a person', () => {
  const input = (overrides: Partial<ActionInput> = {}): ActionInput => ({
    title: 'Send the deck',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    ...overrides,
  });

  const seedItem = () =>
    MaActionItemModel.create({
      meetingId: 'm1',
      fingerprint: 'f1',
      title: 'Send the deck',
      createdById: 'system',
      needsConfirmation: true,
    });

  it('records each change, marks it edited and takes the email from the account', async () => {
    const item = await seedItem();

    const updated = await updateAction(
      String(item._id),
      input({ assignedUserId: colleague.id }),
      employee,
    );

    expect(updated).toMatchObject({
      assignedTo: 'Ravi',
      assignedEmail: colleague.email,
      needsConfirmation: false,
    });
    const stored = await MaActionItemModel.findById(item._id).lean();
    expect(stored?.editedFields).toEqual(['assignedTo', 'assignedUserId']);
    expect(stored?.history.map((h) => [h.field, h.to])).toEqual([
      ['assignedTo', 'Ravi'],
      ['assignedUserId', colleague.id],
    ]);
  });

  it('refuses an assignee outside the company and a blank title', async () => {
    const item = await seedItem();
    const id = String(item._id);

    expect(
      await codeOf(
        updateAction(id, input({ assignedUserId: new Types.ObjectId().toHexString() }), employee),
      ),
    ).toBe('BAD_USER_INPUT');
    expect(await codeOf(updateAction(id, input({ title: '   ' }), employee))).toBe(
      'BAD_USER_INPUT',
    );
    expect(
      await codeOf(setActionStatus(new Types.ObjectId().toHexString(), 'COMPLETED', employee)),
    ).toBe('NOT_FOUND');
  });

  it('stamps completion and clears it when reopened', async () => {
    const item = await seedItem();
    const id = String(item._id);

    await setActionStatus(id, 'COMPLETED', employee);
    expect((await MaActionItemModel.findById(id).lean())?.completedAt).toBeInstanceOf(Date);

    await setActionStatus(id, 'IN_PROGRESS', employee);
    const reopened = await MaActionItemModel.findById(id).lean();
    expect(reopened?.completedAt).toBeNull();
    expect(reopened?.editedFields).toEqual(['status']);
  });
});

describe("a person's activity", () => {
  const read = (ctx: GraphQLContext, userId: string) =>
    auditResolvers.Query.listUserActivityPaged(null, { userId, input: PAGE }, ctx);

  beforeEach(async () => {
    await AuditLogModel.create([
      { action: 'ACCESS', module: 'Meeting Assistant', summary: 'Joined', actorId: employee.id },
      { action: 'UPDATE', module: 'Meeting Assistant', summary: 'Renamed', actorId: employee.id },
      { action: 'ACCESS', module: 'Meeting Assistant', summary: 'Joined', actorId: colleague.id },
    ]);
  });

  it('shows a person their own activity, and only theirs', async () => {
    const page = await read(ctxOf(employee, [ROLES.EMPLOYEE]), employee.id);

    expect(page.totalCount).toBe(2);
    expect(page.rows.every((row) => (row as { actorId?: string }).actorId === employee.id)).toBe(
      true,
    );
  });

  it('lets HR and administrators read anyone’s, and refuses another employee', async () => {
    expect((await read(ctxOf(aiUser, [ROLES.HR]), employee.id)).totalCount).toBe(2);
    expect((await read(ctxOf(aiUser, [ROLES.ADMIN]), colleague.id)).totalCount).toBe(1);
    expect(await codeOf(read(ctxOf(colleague, [ROLES.EMPLOYEE]), employee.id))).toBe('FORBIDDEN');
    expect(await codeOf(read({ user: null }, employee.id))).toBe('UNAUTHENTICATED');
  });
});
