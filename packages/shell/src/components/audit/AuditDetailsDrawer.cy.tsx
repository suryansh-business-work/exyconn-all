import { AuditDetailsDrawer } from './AuditDetailsDrawer';
import { AuditAction } from '@/graphql/generated';
import type { AuditLogRow } from './audit-row';

const row: AuditLogRow = {
  id: 'a1',
  actorId: 'u1',
  actorName: 'Asha',
  actorEmail: 'asha@exyconn.com',
  action: AuditAction.Update,
  module: 'Invoice',
  entityId: 'i1',
  entityLabel: 'INV-001',
  summary: 'Payment recorded on Invoice INV-001',
  changes: JSON.stringify({ status: { from: 'SENT', to: 'PAID' } }),
  ip: '10.0.0.1',
  createdAt: '2026-09-01T10:00:00.000Z',
};

const mount = (value: AuditLogRow | null) =>
  cy.mount(
    <AuditDetailsDrawer
      row={value}
      title="Change details"
      onClose={cy.stub().as('close')}
      formatDateTime={(at) => `on ${at}`}
    />,
  );

describe('AuditDetailsDrawer', () => {
  it('shows who changed what, when, and the field diff', () => {
    mount(row);
    cy.contains('Change details').should('be.visible');
    cy.contains('Payment recorded on Invoice INV-001').should('be.visible');
    cy.contains('Asha (asha@exyconn.com)').should('be.visible');
    cy.contains('on 2026-09-01T10:00:00.000Z').should('be.visible');
    cy.contains('INV-001 · i1').should('be.visible');
    cy.get('table[aria-label="changed fields"]').within(() => {
      cy.contains('td', 'status').should('be.visible');
      cy.contains('td', 'SENT').should('be.visible');
      cy.contains('td', 'PAID').should('be.visible');
    });
    cy.get('[aria-label="Close"]').click();
    cy.get('@close').should('have.been.called');
  });

  it('falls back to the email, the bare id and a dash, and drops the table with no diff', () => {
    mount({ ...row, actorName: '', entityLabel: '', ip: '', changes: '' });
    cy.contains('asha@exyconn.com').should('be.visible');
    cy.contains('Asha (').should('not.exist');
    cy.contains('i1').should('be.visible');
    cy.contains('—').should('be.visible');
    cy.get('table').should('not.exist');
  });

  it('renders nothing without a row', () => {
    mount(null);
    cy.contains('Change details').should('not.exist');
  });
});
