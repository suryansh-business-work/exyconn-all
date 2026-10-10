import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

const visit = (path: string) => {
  globalThis.history.pushState({}, '', path);
  return render(<App />);
};

afterEach(() => {
  globalThis.history.pushState({}, '', '/');
});

describe('App routing', () => {
  it('shows the hub at the root and at /tools', () => {
    const view = visit('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/free tools that/i);
    view.unmount();
    visit('/tools');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/free tools that/i);
  });

  it('shows a category page for /categories/:slug', () => {
    visit('/categories/pdf');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PDF Tools');
  });

  it('lazy-loads a tool route behind a spinner, then shows the tool', async () => {
    visit('/tools/dns-lookup');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /dns lookup/i, level: 1 }, { timeout: 20000 })
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows the 404 page for an unknown path, and for a tool that does not exist', () => {
    const view = visit('/nowhere');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/isn.t here/i);
    view.unmount();
    visit('/tools/not-a-real-tool');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/isn.t here/i);
  });

  it('adds a back-to-top button that starts hidden', () => {
    visit('/');
    expect(screen.getByLabelText('Back to top')).not.toBeVisible();
  });
});
