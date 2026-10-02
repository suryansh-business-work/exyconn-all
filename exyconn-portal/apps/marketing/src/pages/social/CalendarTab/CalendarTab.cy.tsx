import { startOfMonth } from 'date-fns';
import { buildCalendar } from '../calendar.days';
import { post } from '../social.fixtures.cy';
import {
  FB_LINE,
  TODAY,
  X_LINE,
  ZONE,
  line,
  mount,
  now,
  planLabel,
  today,
} from './calendar.fixtures.cy';

describe('CalendarTab', () => {
  it('shows a loader until the accounts and the month first arrive', () => {
    mount({ delay: 400 });
    cy.get('[aria-label="Loading accounts"]').should('exist');
    cy.get('[aria-label="Loading calendar"]').should('exist');
    cy.contains(FB_LINE).should('be.visible');
    cy.get('[aria-label="Loading calendar"]').should('not.exist');
  });

  it("puts this month's posts on their days: a published one links out, a scheduled one edits", () => {
    mount();
    cy.contains('a', FB_LINE).should('have.attr', 'href', 'https://facebook.com/p1');
    cy.get(`button[aria-label="Edit post: ${X_LINE}"]`).click();
    cy.contains('h2', 'Edit post').should('be.visible');
    cy.get('textarea[name="text"]').should('have.value', 'Post p2');
    cy.contains('button', 'Cancel').click();
    cy.contains('h2', 'Edit post').should('not.exist');
  });

  it('filters by account, and keeps the choice in the address', () => {
    mount();
    cy.contains(FB_LINE).should('be.visible');
    cy.get('input[placeholder="All accounts"]').click();
    cy.contains('[role="option"]', 'Exyconn X · X').click();
    cy.get('output[aria-label="address"]').should('have.text', '?accounts=x1');
    cy.contains(FB_LINE).should('not.exist');
    cy.contains(X_LINE).should('be.visible');
  });

  it('reads the chosen accounts back from the address', () => {
    mount({ url: '/marketing/social/calendar?accounts=x1' });
    cy.contains('[role="button"], .MuiChip-root', 'Exyconn X · X').should('be.visible');
    cy.contains(X_LINE).should('be.visible');
    cy.contains(FB_LINE).should('not.exist');
  });

  it('plans a post on today, on the chosen accounts, and shows it once saved', () => {
    mount({ url: '/marketing/social/calendar?accounts=x1' });
    cy.contains(X_LINE).should('be.visible');
    cy.get(`button[aria-label="${planLabel(TODAY)}"]`).click('top');
    cy.contains('h2', 'Schedule a post').should('be.visible');
    cy.contains('.MuiDrawer-paper [role="combobox"]', 'Exyconn X · X').should('be.visible');
    cy.get('input[name="timing"]').should('have.value', 'SCHEDULE');
    cy.contains('label', 'Publish at').should('be.visible');
    cy.get('textarea[name="text"]').type('Planned');
    cy.contains('button', 'Post').click();
    cy.contains('h2', 'Schedule a post').should('not.exist');
    cy.get(`button[aria-label="Edit post: ${X_LINE}"]`).should('have.length', 2);
  });

  it('plans on every account that takes posts when none is chosen', () => {
    mount();
    cy.contains(FB_LINE).should('be.visible');
    cy.get(`button[aria-label="${planLabel(TODAY)}"]`).click('top');
    cy.contains('.MuiDrawer-paper [role="combobox"]', 'Exyconn · Facebook').should(
      'contain.text',
      'Exyconn X · X',
    );
  });

  it('takes no new posts on past days', () => {
    const open = buildCalendar(startOfMonth(now), [], now, ZONE).filter((day) => !day.isPast);
    mount();
    cy.contains(FB_LINE).should('be.visible');
    cy.get('button[aria-label^="Schedule a post on"]').should('have.length', open.length);
    cy.get('button[aria-label="Previous month"]').click();
    cy.get('button[aria-label="Previous month"]').click();
    cy.get('button[aria-label^="Schedule a post on"]').should('not.exist');
  });

  it('ignores accounts in the address that are no longer connected', () => {
    mount({ url: '/marketing/social/calendar?accounts=gone,x1' });
    cy.contains(X_LINE).should('be.visible');
    cy.contains(FB_LINE).should('not.exist');
    cy.get('.MuiChip-root').should('have.length', 1).and('contain.text', 'Exyconn X · X');
  });

  it('shows every account when the only one in the address is gone', () => {
    mount({ url: '/marketing/social/calendar?accounts=gone' });
    cy.contains(FB_LINE).should('be.visible');
    cy.get('input[placeholder="All accounts"]').should('exist');
  });

  it('reveals the rest of a busy day, each post as clickable as the others', () => {
    const busy = [9, 10, 11, 12, 13].map((hour) =>
      post(`b${hour}`, {
        status: 'SCHEDULED',
        publishedAt: null,
        scheduledAt: today(hour),
        origin: 'COMPOSED',
        permalink: '',
      }),
    );
    const last = `Edit post: ${line('Facebook', today(13), 'Scheduled')}`;
    mount({ posts: busy });
    cy.get(`button[aria-label="${last}"]`).should('not.exist');
    cy.contains('button', '+2 more').should('have.attr', 'aria-expanded', 'false').click();
    cy.get(`button[aria-label="${last}"]`).click();
    cy.contains('h2', 'Edit post').should('be.visible');
    cy.get('textarea[name="text"]').should('have.value', 'Post b13');
    cy.contains('button', 'Cancel').click();
    cy.contains('button', 'Show fewer').should('have.attr', 'aria-expanded', 'true').click();
    cy.contains('button', '+2 more').should('be.visible');
  });
});
