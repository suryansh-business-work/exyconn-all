import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ListSheet } from '../../../../../src/components/wa/messages/ListSheet';
import { PHONE_WIDTH, stubMatchMedia } from '../../../media';
import { option, renderMessage } from './messages.fixtures';

const morning = option('s-10', '10:00 AM', 'Dr. Rao');
const late = option('s-11', '11:00 AM');
const content = {
  type: 'list' as const,
  text: 'Pick a slot',
  button: 'See slots',
  sections: [
    { id: 'mon', title: 'Monday', rows: [morning] },
    { id: 'tue', title: 'Tuesday', rows: [late] },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ListSheet', () => {
  it('lists each section with its radio rows and descriptions', () => {
    renderMessage(<ListSheet content={content} open onClose={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: 'Options' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Monday' })).toHaveTextContent('10:00 AMDr. Rao');
    expect(screen.getByRole('region', { name: 'Tuesday' })).toHaveTextContent('11:00 AM');
    expect(screen.getByRole('radio', { name: /10:00 AM/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('cannot send until a row is picked, and marks the picked row', async () => {
    const { user } = renderMessage(<ListSheet content={content} open onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /11:00 AM/ }));
    expect(screen.getByRole('radio', { name: /11:00 AM/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('RadioButtonCheckedIcon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('sends the picked row, then forgets it and closes', async () => {
    const onClose = vi.fn();
    const { actions, user } = renderMessage(<ListSheet content={content} open onClose={onClose} />);
    await user.click(screen.getByRole('radio', { name: /10:00 AM/ }));
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(actions.choose).toHaveBeenCalledWith(morning, 'Pick a slot');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('closes from its close button', async () => {
    const onClose = vi.fn();
    const { user } = renderMessage(<ListSheet content={content} open onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is a bottom sheet on a phone', () => {
    stubMatchMedia(PHONE_WIDTH);
    renderMessage(<ListSheet content={content} open onClose={vi.fn()} />);
    const sheet = screen.getByRole('dialog', { name: 'See slots' });
    expect(sheet.className).toContain('MuiDrawer-paper');
  });

  it('is a dialog on a wide screen', () => {
    renderMessage(<ListSheet content={content} open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'See slots' }).className).toContain(
      'MuiDialog-paper',
    );
  });

  it('shows nothing while closed', () => {
    renderMessage(<ListSheet content={content} open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
