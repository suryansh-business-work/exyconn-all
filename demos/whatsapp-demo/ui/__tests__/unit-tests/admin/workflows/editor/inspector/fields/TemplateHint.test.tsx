import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateHint } from '../../../../../../../src/admin/workflows/editor/inspector/fields/TemplateHint';
import { renderWithProviders } from '../../../../../test-utils';

describe('TemplateHint', () => {
  it('starts collapsed and explains variables, filters and helpers when opened', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TemplateHint />);
    const toggle = screen.getByRole('button', { name: 'Personalise with variables' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('{{orderNo}}')).toBeInTheDocument();
    expect(screen.getByText('A variable set earlier in the chat')).toBeInTheDocument();
    expect(screen.getByText('$price:650:15')).toBeInTheDocument();
    expect(screen.getByText('$days:2 $now')).toBeInTheDocument();
  });

  it('translates the explanations but never the syntax', () => {
    renderWithProviders(<TemplateHint />, {
      messages: { 'Formats rupees': 'Formatiert Rupien', '{{fee|money}}': 'nope' },
    });
    expect(screen.getByText('Formatiert Rupien')).toBeInTheDocument();
    expect(screen.getByText('{{fee|money}}')).toBeInTheDocument();
  });
});
