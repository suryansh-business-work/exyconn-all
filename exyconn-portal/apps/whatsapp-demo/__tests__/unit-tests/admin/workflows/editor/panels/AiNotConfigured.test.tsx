import { screen } from '@testing-library/react';
import { AiNotConfigured } from '../../../../../../src/admin/workflows/editor/panels/AiNotConfigured';
import { renderWithProviders } from '../../../../test-utils';

const MESSAGE = 'OpenAI not configured — set it in Tech > Environment Variables';

describe('AiNotConfigured', () => {
  it('warns with an outlined alert in the inspector', () => {
    renderWithProviders(<AiNotConfigured />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(MESSAGE);
    expect(alert.className).toMatch(/outlined/i);
  });

  it('uses the standard, tighter alert on a node card', () => {
    renderWithProviders(<AiNotConfigured compact />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(MESSAGE);
    expect(alert.className).toMatch(/standard/i);
    expect(alert.className).not.toMatch(/outlined/i);
  });

  it('translates the warning', () => {
    renderWithProviders(<AiNotConfigured />, { messages: { [MESSAGE]: 'OpenAI fehlt' } });
    expect(screen.getByRole('alert')).toHaveTextContent('OpenAI fehlt');
  });
});
