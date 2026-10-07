import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import { env } from '@exyconn/shell/config/env';
import { LoginPromo } from '../../../src/Login/LoginPromo';

const renderPromo = (messages = {}) =>
  render(
    <I18nProvider locale="en" messages={messages}>
      <LoginPromo name="Finance" slogan="Money, minded" accentColor="#1a237e" />
    </I18nProvider>,
  );

describe('LoginPromo', () => {
  it('headlines the portal name with the company slogan under it', () => {
    renderPromo();
    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.getByText('Money, minded')).toBeInTheDocument();
    expect(screen.getByText('By Exyconn')).toBeInTheDocument();
  });

  it('links Explore to the brand site in a new tab', () => {
    renderPromo();
    const explore = screen.getByRole('link', { name: 'Explore' });
    expect(explore).toHaveAttribute('href', env.brandUrl);
    expect(explore).toHaveAttribute('target', '_blank');
    expect(explore).toHaveAttribute('rel', 'noopener');
  });

  it('translates its own wording', () => {
    renderPromo({ Explore: 'Explorar', 'By Exyconn': 'Por Exyconn' });
    expect(screen.getByRole('link', { name: 'Explorar' })).toBeInTheDocument();
    expect(screen.getByText('Por Exyconn')).toBeInTheDocument();
  });
});
