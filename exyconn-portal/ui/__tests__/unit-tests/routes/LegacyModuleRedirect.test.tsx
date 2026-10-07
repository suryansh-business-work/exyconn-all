import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appBaseUrl, appForPath, HUB_URL } from '@exyconn/shell';
import { LegacyModuleRedirect } from '../../../src/routes/LegacyModuleRedirect';

// ExternalRedirect leaves the origin with location.replace, which jsdom cannot stub; the
// redirect target is what this route decides, so it is rendered instead of followed.
vi.mock('@exyconn/shell', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell')>()),
  ExternalRedirect: ({ to }: Readonly<{ to: string }>) => <output>{to}</output>,
}));

function renderAt(route: string) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/portal/*" element={<LegacyModuleRedirect />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getByRole('status').textContent;
}

describe('LegacyModuleRedirect', () => {
  it('forwards an old /portal bookmark to the app that serves the path, keeping the query', () => {
    const app = appForPath('/hr/leave');
    expect(app).toBe('hr');
    expect(renderAt('/portal/hr/leave?x=1')).toBe(`${appBaseUrl('hr')}/hr/leave?x=1`);
  });

  it('forwards a path claimed by a module child to that module app', () => {
    expect(renderAt('/portal/profile')).toBe(`${appBaseUrl('employee')}/profile`);
  });

  it('falls back to the launcher when no app claims the path', () => {
    expect(appForPath('/no-such-module/page')).toBeUndefined();
    expect(renderAt('/portal/no-such-module/page?x=1')).toBe(HUB_URL);
  });

  it('falls back to the launcher for the bare legacy prefix', () => {
    expect(renderAt('/portal/')).toBe(HUB_URL);
  });
});
