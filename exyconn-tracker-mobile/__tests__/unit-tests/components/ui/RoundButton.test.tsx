import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ROUND_BUTTON_SIZE, RoundButton } from '../../../../src/components/ui/RoundButton';
import { renderWithProviders } from '../../test-utils';

describe('RoundButton', () => {
  it('is a named button that runs its action', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <RoundButton label="Asha Rao, open settings" onPress={onPress}>
        <span>AR</span>
      </RoundButton>,
    );
    const button = screen.getByRole('button', { name: 'Asha Rao, open settings' });
    expect(button).toHaveTextContent('AR');
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accepts a raw fill, as the avatar does', () => {
    renderWithProviders(
      <RoundButton label="Theme" onPress={vi.fn()} fill="#4f46e5">
        <span>T</span>
      </RoundButton>,
    );
    expect(screen.getByRole('button', { name: 'Theme' })).toHaveTextContent('T');
  });

  it('is sized to the 44pt touch target', () => {
    expect(ROUND_BUTTON_SIZE).toBe(44);
  });
});
