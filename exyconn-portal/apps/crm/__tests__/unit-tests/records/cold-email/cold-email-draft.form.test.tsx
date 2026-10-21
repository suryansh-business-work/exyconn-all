import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ColdEmailDraftForm } from '../../../../src/records/cold-email/forms/cold-email-draft';
import type { ColdEmailDraftTarget } from '../../../../src/records/cold-email/forms/cold-email-draft';
import { renderWithProviders } from '../../test-utils';
import { fillField, press } from '../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), firecrawlReady: true }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateColdEmailDraftMutation: () => [gql.create, { loading: false }],
  useFirecrawlReadyQuery: () => ({ data: { firecrawlReady: gql.firecrawlReady } }),
}));

const ACME: ColdEmailDraftTarget = {
  object: 'COMPANY',
  id: 'co-1',
  name: 'Acme',
  emails: ['hello@acme.com', 'sales@acme.com'],
  website: 'acme.com',
};

function renderForm(target: ColdEmailDraftTarget = ACME) {
  const onCreated = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <ColdEmailDraftForm target={target} onCreated={onCreated} onCancel={onCancel} />,
  );
  return { onCreated, onCancel };
}

describe('ColdEmailDraftForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage.clear();
    gql.firecrawlReady = true;
    gql.create.mockResolvedValue({ data: { createColdEmailDraft: { id: 'draft-1' } } });
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('generates a draft to the first address and remembers what was offered', async () => {
    const { onCreated } = renderForm();

    await fillField('What we are offering', 'A free checkout audit');
    await press('Generate');

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('draft-1'));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          object: 'COMPANY',
          recordId: 'co-1',
          toEmail: 'hello@acme.com',
          goal: 'A free checkout audit',
          tone: 'FRIENDLY',
          readWebsite: false,
          // Every new draft is written with four versions in one AI run.
          variantCount: 4,
        },
      },
    });
    expect(await screen.findByText('Cold email drafted')).toBeInTheDocument();

    // The next draft starts from the goal typed last time.
    renderForm();
    expect(screen.getAllByLabelText('What we are offering').at(-1)).toHaveValue(
      'A free checkout audit',
    );
  });

  it('says how many versions one run writes, and shows the AI at work while it does', async () => {
    gql.create.mockReturnValue(new Promise(() => undefined));
    renderForm();
    expect(
      screen.getByText('Generating writes 4 versions with the AI in one run and spends AI budget.'),
    ).toBeInTheDocument();

    await fillField('What we are offering', 'A free checkout audit');
    await press('Generate');

    expect(
      await screen.findByRole('progressbar', { name: 'Writing the versions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The AI is writing 4 versions. This can take up to a minute.'),
    ).toBeInTheDocument();
  });

  it('offers to read the website through Firecrawl only when it is set up and they have one', async () => {
    renderForm();
    await userEvent.click(screen.getByLabelText('Read their website first'));
    await press('Generate');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input.readWebsite).toBe(true);
    expect(
      screen.getByText('Reads acme.com through Firecrawl, which costs one Firecrawl call.'),
    ).toBeInTheDocument();
  });

  it('explains why the website cannot be read when Firecrawl is missing', () => {
    gql.firecrawlReady = false;
    renderForm();

    expect(screen.queryByLabelText('Read their website first')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Reading their website needs a website on the record/),
    ).toBeInTheDocument();
  });

  it('asks for an address first when the record has none, without calling the AI', async () => {
    renderForm({ ...ACME, emails: [] });

    expect(
      screen.getByText('Acme has no email address yet. Add one to the record first.'),
    ).toBeInTheDocument();
    await press('Generate');

    expect(await screen.findByText('Choose who it goes to')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('shows the server’s reason when the AI cannot draft, and stays open', async () => {
    gql.create.mockRejectedValue(new Error('The monthly AI budget is used up.'));
    const { onCreated } = renderForm();

    await press('Generate');

    expect(await screen.findByText('The monthly AI budget is used up.')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(portalLogger.warn).toHaveBeenCalled();
  });
});
