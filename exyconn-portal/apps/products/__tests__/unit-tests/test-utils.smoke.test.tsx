import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { renderHookWithProviders, renderWithProviders, useCurrentUrl } from './test-utils';

function Where() {
  const { tab } = useParams();
  return (
    <p>
      {useCurrentUrl()} tab={tab ?? 'none'}
    </p>
  );
}

it('starts the router on the requested route and exposes route params', () => {
  renderWithProviders(<Where />, {
    route: '/products/catalogue?form=new',
    path: '/products/:tab',
  });
  expect(screen.getByText('/products/catalogue?form=new tab=catalogue')).toBeInTheDocument();
});

it('gives hooks Apollo and i18n, falling back to default settings while unanswered', () => {
  const { result } = renderHookWithProviders(() => useSettings());
  expect(result.current.settings.timezone).toBe('UTC');
  expect(typeof result.current.formatDate).toBe('function');
});
