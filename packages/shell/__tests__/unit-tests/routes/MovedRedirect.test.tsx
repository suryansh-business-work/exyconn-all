import { afterEach, describe, expect, it, vi } from 'vitest';
import { MovedRedirect } from '@/routes/MovedRedirect';
import { appUrl } from '@/config/apps';
import { renderWithProviders } from '../test-utils';

const replaceLocation = () => {
  const go = vi.fn();
  vi.stubGlobal('location', { ...globalThis.location, replace: go });
  return go;
};

describe('MovedRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends an old address to the same place under the new prefix, query and hash kept', () => {
    const go = replaceLocation();
    const { container } = renderWithProviders(
      <MovedRedirect app="agents" from="/website/chat" to="/agents/chat" />,
      { route: '/website/chat/sessions/42?tab=live#latest' },
    );
    expect(container).toBeEmptyDOMElement();
    expect(go).toHaveBeenCalledWith(
      `${appUrl('agents', '/agents/chat/sessions/42')}?tab=live#latest`,
    );
  });

  it('lands on the new prefix itself when the address is outside the old one', () => {
    const go = replaceLocation();
    renderWithProviders(<MovedRedirect app="agents" from="/tech/demos" to="/agents" />, {
      route: '/elsewhere',
    });
    expect(go).toHaveBeenCalledWith(appUrl('agents', '/agents'));
  });
});
