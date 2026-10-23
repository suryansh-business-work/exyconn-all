import { runAssistJob } from '../../../../../src/modules/ai/ai.actions';
import { coldEmailResolvers } from '../../../../../src/modules/crm/cold-email/cold-email.resolvers';
import { ColdEmailDraftModel } from '../../../../../src/modules/crm/cold-email/cold-email.model';
import { ourOffering } from '../../../../../src/modules/crm/cold-email/cold-email.offering';
import { knowledgeFor } from '../../../../../src/modules/website-chat/chat.retrieve';
import { OpenAiConfigModel } from '../../../../../src/modules/tech/openai-config.model';
import { ROLES } from '../../../../../src/constants/roles';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';
import { answer, ctxAs, seedAcme } from './coldEmail.fixtures';

// The model and the embeddings are external; what the CRM asks and keeps is under test.
jest.mock('../../../../../src/modules/ai/ai.actions', () => ({ runAssistJob: jest.fn() }));
jest.mock('../../../../../src/modules/website-chat/chat.retrieve', () => ({
  knowledgeFor: jest.fn(),
}));

const ORGANIZATION = useTestOrganization();
const { Mutation, ColdEmailDraft } = coldEmailResolvers;
const ai = jest.mocked(runAssistJob);
const knowledge = jest.mocked(knowledgeFor);
const crm = () => ctxAs(ORGANIZATION, [ROLES.CRM]);

const BRIEF = { about: 'Acme runs grocery stores in Pune.', fit: ['Checkout audit: long queues'] };
const withBrief = (subject: string, brief: object = BRIEF) =>
  answer(JSON.stringify({ brief, versions: [{ subject, body: 'Hello Acme.' }] }));

const TEST_KEY = process.env.TEST_OPENAI_KEY ?? 'test-key';
const activeOpenAi = () =>
  OpenAiConfigModel.create({
    label: 'Primary',
    apiKey: TEST_KEY,
    defaultModel: 'gpt-test',
    isActive: true,
  });

async function create() {
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
        variantCount: 1,
      },
    },
    crm(),
  );
}

afterEach(() => {
  ai.mockReset();
  knowledge.mockReset();
  jest.restoreAllMocks();
});

describe('what of ours fits them', () => {
  it('reads it from our own website knowledge and hands it to the model', async () => {
    await activeOpenAi();
    knowledge.mockResolvedValue({ text: '[1] Checkout audits', sources: [] });
    ai.mockResolvedValueOnce(withBrief('One'));

    await create();

    expect(knowledge).toHaveBeenCalledWith(
      expect.stringContaining('our checkout software'),
      4000,
      expect.any(String),
      expect.objectContaining({ apiKey: TEST_KEY }),
    );
    expect(ai.mock.calls[0][1]).toContain(
      'What we offer, from our own website:\n[1] Checkout audits',
    );
  });

  it('is nothing without an OpenAI key, or for nothing to search on', async () => {
    await expect(ourOffering('Acme sells shoes')).resolves.toBe('');
    await activeOpenAi();
    await expect(ourOffering('   ')).resolves.toBe('');
    expect(knowledge).not.toHaveBeenCalled();
  });

  it('logs a failed lookup and leaves the email to the person’s own offer', async () => {
    await activeOpenAi();
    const failure = new Error('embeddings are down');
    knowledge.mockRejectedValue(failure);
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await expect(ourOffering('Acme sells shoes')).resolves.toBe('');
    expect(warn).toHaveBeenCalledWith({ err: failure }, expect.any(String));
  });
});

describe('the brief on a draft', () => {
  it('keeps what the AI made of them when the draft is written, and refreshes it on a rewrite', async () => {
    ai.mockResolvedValueOnce(withBrief('One'));
    const draft = await create();
    expect(draft.brief).toEqual(BRIEF);

    const fresh = { about: 'Acme now delivers too.', fit: ['Delivery tracking'] };
    ai.mockResolvedValueOnce(withBrief('Two', fresh));
    const rewritten = await Mutation.rewriteColdEmailDraft(
      null,
      { id: draft.id, readWebsite: false },
      crm(),
    );

    expect(rewritten.brief).toEqual(fresh);
  });

  it('reads as empty on a draft written before briefs', async () => {
    ai.mockResolvedValueOnce(
      answer(JSON.stringify({ versions: [{ subject: 'One', body: 'Hi.' }] })),
    );
    const draft = await create();
    await ColdEmailDraftModel.updateOne({ _id: draft.id }, { $unset: { brief: '' } });
    const old = await ColdEmailDraftModel.findById(draft.id).lean();

    expect(ColdEmailDraft.brief(old ?? {})).toEqual({ about: '', fit: [] });
  });
});
