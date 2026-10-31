import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallFlowHeader } from '../../../../../src/pages/bots/call-flows/CallFlowHeader';
import { renderWithProviders } from '../../../test-utils';

type HeaderProps = ComponentProps<typeof CallFlowHeader>;

function renderHeader(overrides: Partial<HeaderProps> = {}) {
  const props: HeaderProps = {
    title: 'Clinic booking',
    hasFlow: true,
    dirty: true,
    errors: 0,
    busy: false,
    onTidy: vi.fn(),
    onRehearse: vi.fn(),
    onScript: vi.fn(),
    onSave: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<CallFlowHeader {...props} />);
  return props;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('CallFlowHeader', () => {
  it('names the example and runs each command', async () => {
    const props = renderHeader();
    expect(screen.getByRole('heading', { name: 'Clinic booking' })).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    for (const [name, handler] of [
      ['Tidy', props.onTidy],
      ['Rehearse', props.onRehearse],
      ['Call script', props.onScript],
      ['Remove flow', props.onRemove],
      ['Save', props.onSave],
    ] as const) {
      await userEvent.click(button(name));
      expect(handler).toHaveBeenCalledTimes(1);
    }
  });

  it('says a stored flow with no edits is saved, with nothing to save', () => {
    renderHeader({ dirty: false });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(button('Save')).toBeDisabled();
    expect(button('Remove flow')).toBeEnabled();
  });

  it('says a starter is shown when nothing is stored, with no script or flow to remove', () => {
    renderHeader({ hasFlow: false });
    expect(screen.getByText('No flow yet: a starter is shown')).toBeInTheDocument();
    expect(button('Call script')).toBeDisabled();
    expect(button('Remove flow')).toBeDisabled();
    expect(button('Save')).toBeEnabled();
  });

  it('counts the problems and refuses to save until they are fixed', () => {
    renderHeader({ errors: 3 });
    expect(screen.getByText('3 problems')).toBeInTheDocument();
    expect(button('Save')).toBeDisabled();
  });

  it('holds Save and Remove while a save runs', () => {
    renderHeader({ busy: true });
    expect(screen.queryByText(/problems/)).not.toBeInTheDocument();
    expect(button('Save')).toBeDisabled();
    expect(button('Remove flow')).toBeDisabled();
  });
});
