import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DemoSteps } from '../../../src/page/DemoSteps';
import { renderWithProviders } from '../test-utils';

const steps = [
  { title: 'Sign in', body: 'Use your work email.' },
  { title: 'Send a message', body: 'Say hello on WhatsApp.' },
  { title: 'Watch it reply', body: 'The bot answers at once.' },
];

describe('DemoSteps', () => {
  it('numbers the steps in order as an ordered list', () => {
    renderWithProviders(<DemoSteps steps={steps} />, {
      messages: { 'Sign in': 'Iniciar sesión' },
    });
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('1Iniciar sesiónUse your work email.');
    expect(items[2]).toHaveTextContent('3Watch it replyThe bot answers at once.');
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Iniciar sesión',
      'Send a message',
      'Watch it reply',
    ]);
  });

  it('renders an empty list when there are no steps', () => {
    renderWithProviders(<DemoSteps steps={[]} />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
