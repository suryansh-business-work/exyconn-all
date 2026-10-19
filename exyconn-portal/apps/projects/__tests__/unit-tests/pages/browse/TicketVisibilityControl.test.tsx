import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskVisibility } from '@exyconn/shell/graphql/generated';
import { TicketVisibilityControl } from '../../../../src/pages/browse/TicketVisibilityControl';
import { renderWithProviders } from '../../test-utils';

const LINK = 'https://status.exyconn.com/ticket/abc';

function renderControl(
  visibility: TaskVisibility,
  publicUrl: string | null = null,
  disabled = false,
) {
  const onChange = vi.fn();
  const onCopy = vi.fn();
  renderWithProviders(
    <TicketVisibilityControl
      visibility={visibility}
      publicUrl={publicUrl}
      disabled={disabled}
      onChange={onChange}
      onCopy={onCopy}
    />,
  );
  return { onChange, onCopy };
}

describe('TicketVisibilityControl', () => {
  it('shows a private ticket as signed-in only, with no link to hand out', () => {
    renderControl(TaskVisibility.Private);

    expect(screen.getByRole('group', { name: 'Who can read this ticket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Private' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Only people signed in to Projects can open it.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy public link' })).not.toBeInTheDocument();
  });

  it('switches to the other visibility, and ignores a click on the current one', async () => {
    const { onChange } = renderControl(TaskVisibility.Private);

    await userEvent.click(screen.getByRole('button', { name: 'Private' }));
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Public' }));
    expect(onChange).toHaveBeenCalledWith(TaskVisibility.Public);
  });

  it('shows a public ticket with its full link, and copies it', async () => {
    const { onCopy } = renderControl(TaskVisibility.Public, LINK);

    expect(
      screen.getByText('Anyone with the link can read it — no comments, history or files.'),
    ).toBeInTheDocument();
    expect(screen.getByText(LINK)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copy public link' }));
    expect(onCopy).toHaveBeenCalledWith(LINK);
  });

  it('cannot be switched while a switch is running', () => {
    renderControl(TaskVisibility.Public, LINK, true);

    expect(screen.getByRole('button', { name: 'Private' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Public' })).toBeDisabled();
  });
});
