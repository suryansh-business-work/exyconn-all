import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewAsField } from '../../../../../../../src/pages/marketing/forms/campaign/personalize/PreviewAsField';
import { renderWithProviders } from '../../../../../test-utils';
import { COMPANY, CONTACT } from '../studio.fixtures';

const gql = vi.hoisted(() => ({ records: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePreviewRecordOptionsQuery: (options: unknown) => gql.records(options),
}));

const field = () => screen.getByRole('combobox', { name: 'Preview as' });

describe('PreviewAsField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.records.mockReturnValue({
      data: { previewRecordOptions: [CONTACT, COMPANY] },
      loading: false,
    });
  });

  it('does not search until two letters are typed', async () => {
    gql.records.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<PreviewAsField value={null} onChange={vi.fn()} />);
    expect(gql.records).toHaveBeenLastCalledWith({ variables: { search: '' }, skip: true });
    await userEvent.click(field());
    expect(await screen.findByText('Type at least two letters')).toBeInTheDocument();
  });

  it('searches the typed text after a pause and groups what it finds', async () => {
    renderWithProviders(<PreviewAsField value={null} onChange={vi.fn()} />);
    await userEvent.type(field(), '  as ');
    await vi.waitFor(() =>
      expect(gql.records).toHaveBeenLastCalledWith({ variables: { search: 'as' }, skip: false }),
    );
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Asha Rao · asha@acme.in' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Acme' })).toBeInTheDocument();
  });

  it('says when nothing matches', async () => {
    gql.records.mockReturnValue({ data: { previewRecordOptions: [] }, loading: false });
    renderWithProviders(<PreviewAsField value={null} onChange={vi.fn()} />);
    await userEvent.type(field(), 'zzz');
    expect(await screen.findByText('No matching contact or company')).toBeInTheDocument();
  });

  it('hands over the chosen record, and null when cleared', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(<PreviewAsField value={null} onChange={onChange} />);
    await userEvent.click(field());
    await userEvent.click(screen.getByRole('option', { name: 'Acme' }));
    expect(onChange).toHaveBeenLastCalledWith(COMPANY);
    rerender(<PreviewAsField value={CONTACT} onChange={onChange} />);
    expect(field()).toHaveValue('Asha Rao · asha@acme.in');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
