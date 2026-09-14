import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudFormPage } from '@/components/data/CrudFormPage';
import { MAIN_CONTENT_ID, SkipLink } from '@/layout/PortalLayout/SkipLink';

/**
 * WCAG 2.2 structure every portal page inherits from the shell: one h1 per page, a browser
 * tab titled for the page (SC 2.4.2), and a way past the sidebar (SC 2.4.1).
 */
describe('a portal page', () => {
  afterEach(() => {
    document.title = '';
  });

  it('opens with its title as the one h1', () => {
    render(<PageHeader title="Leave requests" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Leave requests' })).toBeDefined();
  });

  it('titles the browser tab after itself', () => {
    render(<PageHeader title="Leave requests" />);

    expect(document.title).toContain('Leave requests');
  });

  it('titles a full-page form the same way, as the page it replaces', () => {
    render(
      <CrudFormPage title="New {entity}" titleValues={{ entity: 'invoice' }} onBack={() => {}}>
        <div />
      </CrudFormPage>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'New invoice' })).toBeDefined();
    expect(document.title).toContain('New invoice');
  });
});

describe('the way past the sidebar', () => {
  it('links to the main region by the id the layout gives it', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link.getAttribute('href')).toBe(`#${MAIN_CONTENT_ID}`);
  });
});
