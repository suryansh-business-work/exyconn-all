import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  SuppressionNoteForm,
  suppressionNoteSchema,
} from '../../../../../../src/pages/suppression/forms/suppression-note';
import { renderWithProviders } from '../../../../test-utils';
import { fill, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ updateNote: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateMarketingSuppressionNoteMutation: () => [gql.updateNote],
}));

function renderNote(note = 'Asked by phone') {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <SuppressionNoteForm id="suppression-1" note={note} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

describe('suppressionNoteSchema', () => {
  it('trims the note and allows it empty', () => {
    expect(suppressionNoteSchema.parse({ note: '  kept  ' })).toEqual({ note: 'kept' });
    expect(suppressionNoteSchema.parse({ note: '' })).toEqual({ note: '' });
  });

  it('allows exactly 500 characters and rejects 501', () => {
    expect(suppressionNoteSchema.safeParse({ note: 'x'.repeat(500) }).success).toBe(true);
    const tooLong = suppressionNoteSchema.safeParse({ note: 'x'.repeat(501) });
    expect(tooLong.error?.issues[0].message).toBe('Keep the note under 500 characters');
  });
});

describe('SuppressionNoteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.updateNote.mockResolvedValue({
      data: { updateMarketingSuppressionNote: { id: 'suppression-1', note: 'x' } },
    });
  });

  it('starts from the stored note, focused, and counts its characters', () => {
    renderNote();

    const field = screen.getByLabelText('Internal note');
    expect(field).toHaveValue('Asked by phone');
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute('maxLength', '500');
    expect(screen.getByText('Visible to the marketing team only. 14/500')).toBeInTheDocument();
  });

  it('updates the counter as the note changes', () => {
    renderNote('');
    expect(screen.getByText('Visible to the marketing team only. 0/500')).toBeInTheDocument();

    fill('Internal note', 'Legal');

    expect(screen.getByText('Visible to the marketing team only. 5/500')).toBeInTheDocument();
  });

  it('saves the trimmed note, confirms it and closes', async () => {
    const { onDone } = renderNote();
    fill('Internal note', '  Re-subscribed in March  ');

    await press('Save note');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.updateNote).toHaveBeenCalledWith({
      variables: { id: 'suppression-1', note: 'Re-subscribed in March' },
    });
    expect(await screen.findByText('Note saved')).toBeInTheDocument();
  });

  it('lets the note be cleared', async () => {
    const { onDone } = renderNote();
    fill('Internal note', '');

    await press('Save note');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.updateNote).toHaveBeenCalledWith({ variables: { id: 'suppression-1', note: '' } });
  });

  it('refuses a note over the limit', async () => {
    renderNote();
    fill('Internal note', 'x'.repeat(501));

    await press('Save note');

    expect(await screen.findByText('Keep the note under 500 characters')).toBeInTheDocument();
    expect(gql.updateNote).not.toHaveBeenCalled();
  });

  it('shows the server error and stays open when saving fails', async () => {
    gql.updateNote.mockRejectedValue(new Error('Suppression not found'));
    const { onDone } = renderNote();

    await press('Save note');

    expect(await screen.findByText('Suppression not found')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.updateNote.mockRejectedValue({ code: 500 });
    renderNote();

    await press('Save note');

    expect(await screen.findByText('The note could not be saved')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderNote();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.updateNote).not.toHaveBeenCalled();
  });
});
