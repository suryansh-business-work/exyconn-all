import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { WebsiteChatSite, WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import { ChatSessionFilters } from '../../../../../src/pages/chat/sessions/ChatSessionFilters';
import {
  EMPTY_CHAT_SESSION_FILTERS,
  type ChatSessionFilterState,
} from '../../../../../src/pages/chat/sessions/chat-sessions.filters';
import { renderWithProviders } from '../../../test-utils';
import { PICKED_DAY } from './date-picker-stub';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/components/ui')>();
  const { DatePickerStub } = await import('./date-picker-stub');
  return { ...actual, DatePicker: DatePickerStub };
});

function renderFilters(value: ChatSessionFilterState = EMPTY_CHAT_SESSION_FILTERS) {
  const onChange = vi.fn();
  const view = renderWithProviders(<ChatSessionFilters value={value} onChange={onChange} />);
  return { onChange, view };
}

function chooseOption(field: string, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: field }));
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ChatSessionFilters selects', () => {
  it('filters by status', () => {
    const { onChange } = renderFilters();
    chooseOption('Status', 'Open');
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_CHAT_SESSION_FILTERS,
      status: WebsiteChatStatus.Open,
    });
  });

  it('lists every status and site with an "all" choice first', () => {
    renderFilters();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All statuses',
      'Open',
      'Closed',
    ]);
  });

  it('filters by site, named as people say it', () => {
    const { onChange } = renderFilters();
    chooseOption('Site', 'Tools site');
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_CHAT_SESSION_FILTERS,
      site: WebsiteChatSite.Tools,
    });
  });

  it('goes back to every site with "All sites"', () => {
    const { onChange } = renderFilters({
      ...EMPTY_CHAT_SESSION_FILTERS,
      site: WebsiteChatSite.Website,
    });
    chooseOption('Site', 'All sites');
    expect(onChange).toHaveBeenCalledWith(EMPTY_CHAT_SESSION_FILTERS);
  });
});

describe('ChatSessionFilters assignee', () => {
  it('asks again only once typing pauses for 400ms', () => {
    vi.useFakeTimers();
    const { onChange } = renderFilters();
    const box = screen.getByRole('textbox', { name: 'Assignee' });

    fireEvent.change(box, { target: { value: 'Ra' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.change(box, { target: { value: 'Ravi' } });
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_CHAT_SESSION_FILTERS, assignee: 'Ravi' });
  });

  it('follows an assignee set from outside without asking again', () => {
    vi.useFakeTimers();
    const { onChange, view } = renderFilters();

    view.rerender(
      <ChatSessionFilters
        value={{ ...EMPTY_CHAT_SESSION_FILTERS, assignee: 'Mina' }}
        onChange={onChange}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('textbox', { name: 'Assignee' })).toHaveValue('Mina');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ChatSessionFilters dates, unread and clear', () => {
  it('sets the started and last-message ranges', () => {
    const { onChange } = renderFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Started from' }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_CHAT_SESSION_FILTERS,
      created: { from: PICKED_DAY, to: null },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Last message to' }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_CHAT_SESSION_FILTERS,
      lastMessage: { from: null, to: PICKED_DAY },
    });
  });

  it('shows only unread chats when switched on', () => {
    const { onChange } = renderFilters();
    fireEvent.click(screen.getByLabelText('Unread only'));
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_CHAT_SESSION_FILTERS, unreadOnly: true });
  });

  it('offers Clear only once a filter is set', () => {
    renderFilters();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('clears every filter at once', () => {
    const { onChange } = renderFilters({
      ...EMPTY_CHAT_SESSION_FILTERS,
      status: WebsiteChatStatus.Closed,
      unreadOnly: true,
    });
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear).toBeEnabled();
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith(EMPTY_CHAT_SESSION_FILTERS);
  });
});
