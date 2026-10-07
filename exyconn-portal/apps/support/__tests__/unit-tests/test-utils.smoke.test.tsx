import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { useT } from '@exyconn/i18n';
import { useParams } from 'react-router-dom';
import { renderWithProviders, useCurrentUrl } from './test-utils';

function Probe() {
  const t = useT();
  const { id } = useParams();
  return (
    <p>
      {t('Ticket')} {id ?? 'none'} {useCurrentUrl()}
    </p>
  );
}

describe('renderWithProviders', () => {
  it('mounts under the given route pattern so params and the URL resolve', () => {
    renderWithProviders(<Probe />, { route: '/support/tickets/t1', path: '/support/tickets/:id' });
    expect(screen.getByText('Ticket t1 /support/tickets/t1')).toBeInTheDocument();
  });

  it('renders translated text from the supplied messages', () => {
    renderWithProviders(<Probe />, { messages: { Ticket: 'Billet' }, locale: 'fr' });
    expect(screen.getByText('Billet none /')).toBeInTheDocument();
  });
});
