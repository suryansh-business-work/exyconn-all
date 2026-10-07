import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Surface } from '../../../../src/components/ui/Surface';
import { renderWithProviders } from '../../test-utils';

describe('Surface', () => {
  it('holds its content in one panel', () => {
    renderWithProviders(
      <Surface testID="panel">
        <span>Card content</span>
      </Surface>,
    );
    expect(screen.getByTestId('panel')).toContainElement(screen.getByText('Card content'));
  });
});
