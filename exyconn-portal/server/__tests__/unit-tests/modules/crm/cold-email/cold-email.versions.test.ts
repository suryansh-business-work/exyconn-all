import { runAssistJob } from '../../../../../src/modules/ai/ai.actions';
import { coldEmailResolvers } from '../../../../../src/modules/crm/cold-email/cold-email.resolvers';
import { ColdEmailDraftModel } from '../../../../../src/modules/crm/cold-email/cold-email.model';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { ROLES } from '../../../../../src/constants/roles';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';
import { answer, ctxAs, email, seedAcme, versions } from './coldEmail.fixtures';

// The model is external; how many versions the CRM asks for and keeps is under test.
jest.mock('../../../../../src/modules/ai/ai.actions', () => ({ runAssistJob: jest.fn() }));

const ORGANIZATION = useTestOrganization();
const { Mutation, ColdEmailDraft } = coldEmailResolvers;
const ai = jest.mocked(runAssistJob);
const crm = () => ctxAs(ORGANIZATION, [ROLES.CRM]);
const promptOf = (call: number) => ai.mock.calls[call][1];
const subjectsOf = (draft: { variants: Array<{ subject: string }> }) =>
  draft.variants.map((variant) => variant.subject);

async function create(variantCount?: number | null) {
  const acme = await seedAcme();
  return Mutation.createColdEmailDraft(
    null,
    {
      input: {
        object: 'COMPANY',
        recordId: acme.id,
        toEmail: 'hello@acme.com',
        goal: 'our checkout software',
        tone: 'FRIENDLY',
        variantCount,
      },
    },
    crm(),
  );
}

/** A draft already holding `count` versions. */
async function draftWith(count: number) {
  ai.mockResolvedValueOnce(versions(Array.from({ length: count }, (_v, i) => `v${i + 1}`)));
  const draft = await create(Math.min(count, 4));
  const extra = Array.from({ length: count - draft.variants.length }, (_v, i) => ({
    subject: `v${draft.variants.length + i + 1}`,
    body: 'b',
    tone: 'FRIENDLY',
  }));
  await ColdEmailDraftModel.updateOne({ _id: draft.id }, { $push: { variants: { $each: extra } } });
  ai.mockClear();
  return draft;
}

const rewrite = (id: string, ctx = crm()) =>
  Mutation.rewriteColdEmailDraft(null, { id, readWebsite: false }, ctx);

afterEach(() => {
  ai.mockReset();
});

describe('how many versions a new draft writes', () => {
  it('writes four in one AI run by default, sharing the run’s cost between them', async () => {
    ai.mockResolvedValueOnce(versions(['One', 'Two', 'Three', 'Four'], 0.08));

    const draft = await create();

    expect(ai).toHaveBeenCalledTimes(1);
    expect(subjectsOf(draft)).toEqual(['One', 'Two', 'Three', 'Four']);
    expect(draft.variants.map((variant) => variant.costUsd)).toEqual([0.02, 0.02, 0.02, 0.02]);
    expect(promptOf(0)).toContain('Write 4 clearly different versions of it.');
    expect(ColdEmailDraft.maxVariants()).toBe(10);
    // The timeline names the first version.
    const note = await ActivityModel.findOne({ subject: 'Cold email drafted' }).lean();
    expect(note?.notes).toBe('To hello@acme.com: One');
  });

  it('writes the number asked for, and keeps no more than that when the AI writes extra', async () => {
    ai.mockResolvedValueOnce(versions(['One', 'Two', 'Three']));

    const draft = await create(2);

    expect(subjectsOf(draft)).toEqual(['One', 'Two']);
    expect(promptOf(0)).toContain('Write 2 clearly different versions of it.');
    expect(promptOf(0)).toContain('- Version 2 opens with a problem');
    expect(promptOf(0)).not.toContain('- Version 3');
  });

  it('asks for exactly one version when one is wanted', async () => {
    ai.mockResolvedValueOnce(email('Only one'));

    const draft = await create(1);

    expect(subjectsOf(draft)).toEqual(['Only one']);
    expect(promptOf(0)).toContain(
      '"versions": [{"subject": "...", "body": "..."}]}, and nothing else.',
    );
    expect(promptOf(0)).not.toContain('clearly different versions');
  });

  it.each([0, 5, 2.5])('refuses %p versions before spending anything', async (count) => {
    const result = create(count);

    await expect(result).rejects.toThrow('Ask for between 1 and 4 versions.');
    await expect(codeOf(result)).resolves.toBe('BAD_USER_INPUT');
    expect(ai).not.toHaveBeenCalled();
    await expect(ColdEmailDraftModel.countDocuments()).resolves.toBe(0);
  });

  it('keeps the usable versions of a batch and drops one that still has a placeholder', async () => {
    ai.mockResolvedValueOnce(versions(['Hi [Name]', 'Good one', 'Also good']));

    const draft = await create(3);

    expect(ai).toHaveBeenCalledTimes(1);
    expect(subjectsOf(draft)).toEqual(['Good one', 'Also good']);
  });

  it('asks the AI for one version at a time when adding one', async () => {
    const draft = await draftWith(2);
    ai.mockResolvedValueOnce(email('Third'));

    const saved = await Mutation.addColdEmailVariant(null, { id: draft.id }, crm());

    expect(subjectsOf(saved)).toEqual(['v1', 'v2', 'Third']);
    expect(promptOf(0)).not.toContain('clearly different versions');
  });

  it('refuses to add one when the draft filled up while the AI was writing it', async () => {
    const draft = await draftWith(9);
    ai.mockImplementationOnce(async () => {
      await ColdEmailDraftModel.updateOne(
        { _id: draft.id },
        { $push: { variants: { subject: 'meanwhile', body: 'b', tone: 'FRIENDLY' } } },
      );
      return email('Too late');
    });

    await expect(Mutation.addColdEmailVariant(null, { id: draft.id }, crm())).rejects.toThrow(
      'A draft holds at most 10 versions.',
    );
    const stored = await ColdEmailDraftModel.findById(draft.id).lean();
    expect(stored?.variants).toHaveLength(10);
  });
});

describe('rewriting a draft from the latest data', () => {
  it('adds four fresh versions in one run, avoiding the earlier subjects, and audits it', async () => {
    const draft = await draftWith(1);
    ai.mockResolvedValueOnce(versions(['N1', 'N2', 'N3', 'N4']));

    const saved = await rewrite(draft.id);

    expect(ai).toHaveBeenCalledTimes(1);
    expect(subjectsOf(saved)).toEqual(['v1', 'N1', 'N2', 'N3', 'N4']);
    expect(saved.variants[1].tone).toBe('FRIENDLY');
    expect(promptOf(0)).toContain('Write 4 clearly different versions of it.');
    expect(promptOf(0)).toContain('earlier versions: v1');
    const audit = await AuditLogModel.findOne({
      module: 'ColdEmailDraft',
      action: 'UPDATE',
    }).lean();
    expect(audit).toMatchObject({
      entityId: draft.id,
      entityLabel: 'Acme',
      summary: 'Rewrote the cold email from the latest data',
    });
  });

  it('asks only for as many as the draft still has room for', async () => {
    const draft = await draftWith(8);
    ai.mockResolvedValueOnce(versions(['N1', 'N2']));

    const saved = await rewrite(draft.id);

    expect(promptOf(0)).toContain('Write 2 clearly different versions of it.');
    expect(saved.variants).toHaveLength(10);
  });

  it('refuses a full draft without calling the AI', async () => {
    const draft = await draftWith(10);

    const result = rewrite(draft.id);

    await expect(result).rejects.toThrow('This draft already holds 10 versions');
    await expect(codeOf(result)).resolves.toBe('BAD_USER_INPUT');
    expect(ai).not.toHaveBeenCalled();
  });

  it('checks the cap again on the write, so a draft filled meanwhile is not overfilled', async () => {
    const draft = await draftWith(7);
    ai.mockImplementationOnce(async () => {
      // Another rewrite lands while this one is with the AI.
      await ColdEmailDraftModel.updateOne(
        { _id: draft.id },
        { $push: { variants: { $each: [{ subject: 'meanwhile', body: 'b', tone: 'FRIENDLY' }] } } },
      );
      return versions(['N1', 'N2', 'N3']);
    });

    await expect(codeOf(rewrite(draft.id))).resolves.toBe('BAD_USER_INPUT');

    const stored = await ColdEmailDraftModel.findById(draft.id).lean();
    expect(stored?.variants).toHaveLength(8);
    await expect(
      AuditLogModel.countDocuments({ module: 'ColdEmailDraft', action: 'UPDATE' }),
    ).resolves.toBe(0);
  });

  it('retries once when the first answer has nothing usable', async () => {
    const draft = await draftWith(1);
    ai.mockResolvedValueOnce(answer('No JSON here', 0.01)).mockResolvedValueOnce(
      versions(['N1', 'N2', 'N3', 'N4'], 0.03),
    );

    const saved = await rewrite(draft.id);

    expect(ai).toHaveBeenCalledTimes(2);
    expect(saved.variants).toHaveLength(5);
    // Both runs are paid for, split across the versions kept.
    expect(saved.variants[1].costUsd).toBeCloseTo(0.01);
  });

  it('is for the CRM desk, and a missing draft is not found', async () => {
    const draft = await draftWith(1);

    await expect(codeOf(rewrite(draft.id, ctxAs(ORGANIZATION, [ROLES.HR])))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(codeOf(rewrite('64b000000000000000000000'))).resolves.toBe('NOT_FOUND');
    expect(ai).not.toHaveBeenCalled();
  });
});
