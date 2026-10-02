import { useRef } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useFocusOnNavigate } from './useFocusOnNavigate';

/** The shape of the layout: a nav outside the main region, and tabs that live inside it. */
function Harness() {
  const main = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useFocusOnNavigate(main);
  return (
    <>
      <nav>
        <Link to="/people">People</Link>
      </nav>
      <main ref={main} tabIndex={-1} data-cy="main">
        <h1>{pathname}</h1>
        <Link to="/people/leave">Leave tab</Link>
        <Routes>
          <Route path="*" element={null} />
        </Routes>
      </main>
    </>
  );
}

const mountAt = (path: string) =>
  cy.mount(
    <MemoryRouter initialEntries={[path]}>
      <Harness />
    </MemoryRouter>,
  );

describe('useFocusOnNavigate', () => {
  it('leaves focus where it was on the page the layout opened on', () => {
    mountAt('/home');
    cy.get('[data-cy=main]').should('not.have.focus');
  });

  it('moves focus to the main region when a link outside it changes the page', () => {
    mountAt('/home');
    cy.contains('a', 'People').focus().click();
    cy.get('h1').should('have.text', '/people');
    cy.get('[data-cy=main]').should('have.focus');
  });

  it('keeps focus on a tab inside the region, so a keyboard user does not lose their place', () => {
    mountAt('/people');
    cy.contains('a', 'Leave tab').focus().click();
    cy.get('h1').should('have.text', '/people/leave');
    cy.contains('a', 'Leave tab').should('have.focus');
    cy.get('[data-cy=main]').should('not.have.focus');
  });
});
