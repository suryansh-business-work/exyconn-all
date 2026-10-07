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
      {t('Project')} {id ?? 'none'} {useCurrentUrl()}
    </p>
  );
}

describe('renderWithProviders', () => {
  it('mounts under the given route pattern so params and the URL resolve', () => {
    renderWithProviders(<Probe />, { route: '/projects/p1/board', path: '/projects/:id/:tab?' });
    expect(screen.getByText('Project p1 /projects/p1/board')).toBeInTheDocument();
  });

  it('renders translated text from the supplied messages', () => {
    renderWithProviders(<Probe />, { messages: { Project: 'Projet' }, locale: 'fr' });
    expect(screen.getByText('Projet none /')).toBeInTheDocument();
  });
});
