import type { ChangeEvent, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SupportCategory, useListActiveCannedRepliesQuery } from '@/graphql/generated';
import { CannedReplyPicker } from '@/pages/ticket-desk/forms/support-reply/CannedReplyPicker';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useListActiveCannedRepliesQuery: vi.fn(),
}));

interface FieldStubProps {
  label?: ReactNode;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

/*
 * MUI's Select only ever reports the value of one of its own menu items, so a value that
 * names no snippet cannot be produced through it. A plain input stands in for the field so
 * the picker's own guard can be handed an id it does not know.
 */
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/ui')>()),
  TextField: ({ label, onChange }: Readonly<FieldStubProps>) => (
    <label>
      {label}
      <input onChange={onChange} />
    </label>
  ),
}));

const snippets = [
  { id: 'c-1', title: 'Greeting', category: SupportCategory.It, body: 'Hi there,', isActive: true },
  { id: 'c-2', title: 'Sign-off', category: SupportCategory.It, body: 'Thanks!', isActive: true },
];

function renderPicker() {
  vi.mocked(useListActiveCannedRepliesQuery).mockReturnValue(
    queryResult({ listActiveCannedReplies: snippets }) as never,
  );
  const onPick = vi.fn();
  renderWithProviders(<CannedReplyPicker onPick={onPick} />);
  return onPick;
}

const pick = (value: string) =>
  fireEvent.change(screen.getByLabelText('Insert a canned reply'), { target: { value } });

describe('CannedReplyPicker — picks it cannot match', () => {
  it('hands over the text of the snippet whose id was picked', () => {
    const onPick = renderPicker();
    pick('c-2');
    expect(onPick).toHaveBeenCalledWith('Thanks!');
  });

  it('drops nothing into the message for an id that names no saved snippet', () => {
    const onPick = renderPicker();
    pick('c-404');
    expect(onPick).not.toHaveBeenCalled();
  });
});
