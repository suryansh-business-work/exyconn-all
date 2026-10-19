import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DemosForbidden } from '../../../../../src/pages/demos/website-bot/DemosForbidden';
import { renderWithProviders } from '../../../test-utils';

describe('DemosForbidden', () => {
  it('says who may open the demo bots and whom to ask', () => {
    renderWithProviders(<DemosForbidden />);
    expect(screen.getByText('No access to the demo bots')).toBeInTheDocument();
    expect(screen.getByText(/open to Tech staff and company administrators/)).toBeInTheDocument();
  });
});
