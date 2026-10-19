import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { LegacyCrmRedirect } from '../../src/LegacyCrmRedirect';
import { UrlProbe } from './form-stub';

/** Opens `url`, letting the redirect mounted under /crm send it on. */
function open(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/crm/*" element={<LegacyCrmRedirect />} />
        <Route path="*" element={<UrlProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getByLabelText('current url').textContent;
}

describe('LegacyCrmRedirect', () => {
  it('opens an old /crm link at the same page without the prefix', () => {
    expect(open('/crm/companies/company-1/people')).toBe('/companies/company-1/people');
  });

  it('keeps the query string', () => {
    expect(open('/crm/contacts?preview=contact-2')).toBe('/contacts?preview=contact-2');
  });

  it('sends the bare /crm to the home page', () => {
    expect(open('/crm')).toBe('/');
  });
});
