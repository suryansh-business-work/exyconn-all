import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { useWaPalette } from '../../src/theme/useWa';
import { WA_LIGHT } from '../../src/theme/wa.tokens';
import { renderHookWithProviders, renderWithProviders, useCurrentUrl } from './test-utils';

function Probe() {
  const t = useT();
  const { demoKey } = useParams();
  return (
    <p>
      {t('Hello')} {demoKey} {useCurrentUrl()}
    </p>
  );
}

describe('test-utils providers', () => {
  it('mounts the UI under the given route pattern with i18n falling back to English', () => {
    renderWithProviders(<Probe />, {
      route: '/whatsapp-demo/clinic?x=1',
      path: '/whatsapp-demo/:demoKey?',
    });
    expect(screen.getByText('Hello clinic /whatsapp-demo/clinic?x=1')).toBeInTheDocument();
  });

  it('renders translations passed as messages', () => {
    renderWithProviders(<Probe />, { messages: { Hello: 'Hola' } });
    expect(screen.getByText(/Hola/)).toBeInTheDocument();
  });

  it('provides the colour-mode MUI theme to hooks', () => {
    const { result } = renderHookWithProviders(() => useWaPalette());
    expect(result.current).toBe(WA_LIGHT);
  });
});
