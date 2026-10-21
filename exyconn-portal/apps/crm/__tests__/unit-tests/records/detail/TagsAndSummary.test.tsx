import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmTagObject, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { AiSummary, TagsEditor } from '../../../../src/records/detail';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  tags: vi.fn(),
  save: vi.fn(),
  saving: false,
  summarise: vi.fn(),
  summarising: false,
  warn: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmTagsQuery: (options: unknown) => gql.tags(options),
  useSetCrmTagsMutation: () => [gql.save, { loading: gql.saving }],
  useCrmRecordSummaryMutation: () => [gql.summarise, { loading: gql.summarising }],
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: (...args: unknown[]) => gql.warn(...args) },
}));

function renderTags(tags: string[] = ['vip']) {
  renderWithProviders(<TagsEditor object={CrmTagObject.Contact} id="contact-1" tags={tags} />);
  return screen.getByRole('combobox', { name: 'Tags' });
}

function chips() {
  return Array.from(document.querySelectorAll('.MuiChip-label')).map((chip) => chip.textContent);
}

describe('TagsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.saving = false;
    gql.tags.mockReturnValue({ data: { crmTags: ['vip', 'partner'] } });
    gql.save.mockImplementation(({ variables }: { variables: { tags: string[] } }) =>
      Promise.resolve({
        data: { setCrmTags: [...variables.tags].sort((a, b) => a.localeCompare(b)) },
      }),
    );
  });

  it('adds a typed tag, saves at once and shows what the server kept', async () => {
    const input = renderTags();
    expect(gql.tags).toHaveBeenCalledWith({ variables: { object: CrmTagObject.Contact } });
    await userEvent.type(input, '  hot  {Enter}');
    await waitFor(() =>
      expect(gql.save).toHaveBeenCalledWith({
        variables: { object: CrmTagObject.Contact, id: 'contact-1', tags: ['vip', 'hot'] },
        refetchQueries: ['CrmTags'],
      }),
    );
    await waitFor(() => expect(chips()).toEqual(['hot', 'vip']));
  });

  it('picks a tag already used elsewhere', async () => {
    const input = renderTags([]);
    expect(input).toHaveAttribute('placeholder', 'Add a tag and press Enter');
    await userEvent.click(input);
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'partner' }),
    );
    await waitFor(() => expect(chips()).toEqual(['partner']));
    expect(input).not.toHaveAttribute('placeholder');
  });

  it('keeps the tags the form sent when the server answers without a list', async () => {
    gql.save.mockResolvedValue({ data: undefined });
    gql.tags.mockReturnValue({ data: undefined });
    const input = renderTags();
    await userEvent.type(input, 'new{Enter}');
    await waitFor(() => expect(gql.save).toHaveBeenCalled());
    expect(chips()).toEqual(['vip', 'new']);
  });

  it('refuses a tag that is too long', async () => {
    const input = renderTags();
    await userEvent.type(input, `${'x'.repeat(41)}{Enter}`);
    expect(
      await screen.findByText('Use up to 20 tags of at most 40 characters each.'),
    ).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
    expect(chips()).toEqual(['vip']);
  });

  it('refuses more than twenty tags', async () => {
    const input = renderTags(Array.from({ length: 20 }, (_unused, index) => `t${index}`));
    await userEvent.type(input, 'one-more{Enter}');
    expect(
      await screen.findByText('Use up to 20 tags of at most 40 characters each.'),
    ).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('puts the tags back and says why when saving failed', async () => {
    const failure = new Error('Not allowed');
    gql.save.mockRejectedValue(failure);
    const input = renderTags();
    await userEvent.type(input, 'hot{Enter}');
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(chips()).toEqual(['vip']);
    expect(gql.warn).toHaveBeenCalledWith('crm: saving tags failed', failure);
  });

  it('still logs when reporting a failed save fails', async () => {
    gql.save.mockRejectedValue(new Error('x'));
    gql.warn.mockImplementationOnce(() => {
      throw new Error('logger offline');
    });
    const input = renderTags();
    await userEvent.type(input, 'hot{Enter}');
    await waitFor(() =>
      expect(gql.warn).toHaveBeenLastCalledWith(
        'crm: tags change failed',
        expect.objectContaining({ message: 'logger offline' }),
      ),
    );
  });

  it('is locked while saving', () => {
    gql.saving = true;
    expect(renderTags()).toBeDisabled();
  });
});

describe('AiSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.summarising = false;
  });

  function renderSummary() {
    renderWithProviders(
      <AiSummary object={CrmTimelineObject.Company} id="company-1" name="Acme" />,
    );
    return screen.getByRole('region', { name: 'Acme summary' });
  }

  it('explains itself until asked, then shows the summary and when it was written', async () => {
    gql.summarise.mockResolvedValue({ data: { crmRecordSummary: 'Interested in 50 seats.' } });
    const region = renderSummary();
    expect(region).toHaveTextContent('Summarise this record from its timeline');
    await userEvent.click(within(region).getByRole('button', { name: 'Summarise with AI' }));
    expect(await within(region).findByText('Interested in 50 seats.')).toBeInTheDocument();
    expect(gql.summarise).toHaveBeenCalledWith({
      variables: { object: CrmTimelineObject.Company, id: 'company-1' },
    });
    expect(region.querySelector('time')).toHaveTextContent(/^Generated /);
    expect(within(region).getByRole('button', { name: 'Refresh summary' })).toBeInTheDocument();
  });

  it('shows an empty summary when the AI returned nothing', async () => {
    gql.summarise.mockResolvedValue({ data: undefined });
    const region = renderSummary();
    await userEvent.click(within(region).getByRole('button', { name: 'Summarise with AI' }));
    await waitFor(() =>
      expect(within(region).getByRole('button', { name: 'Refresh summary' })).toBeInTheDocument(),
    );
    expect(region).not.toHaveTextContent('Summarise this record from its timeline');
  });

  it('says why the AI failed and clears that on the next try', async () => {
    gql.summarise
      .mockRejectedValueOnce({})
      .mockResolvedValueOnce({ data: { crmRecordSummary: 'Done' } });
    const region = renderSummary();
    await userEvent.click(within(region).getByRole('button', { name: 'Summarise with AI' }));
    expect(await within(region).findByRole('alert')).toHaveTextContent(
      'The AI could not write a summary.',
    );
    await userEvent.click(within(region).getByRole('button', { name: 'Summarise with AI' }));
    await within(region).findByText('Done');
    expect(within(region).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('still logs when reporting a failed summary fails', async () => {
    gql.summarise.mockRejectedValue(new Error('x'));
    gql.warn.mockImplementationOnce(() => {
      throw new Error('logger offline');
    });
    const region = renderSummary();
    await userEvent.click(within(region).getByRole('button', { name: 'Summarise with AI' }));
    await waitFor(() =>
      expect(gql.warn).toHaveBeenLastCalledWith(
        'crm: AI summary failed',
        expect.objectContaining({ message: 'logger offline' }),
      ),
    );
  });

  it('shows the button busy while the AI writes', () => {
    gql.summarising = true;
    const region = renderSummary();
    expect(within(region).getByRole('button', { name: /Summarise with AI/ })).toBeDisabled();
  });
});
