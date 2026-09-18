import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { OrgFlowChart } from './OrgFlowChart';
import { buildOrgTree } from './org-tree';

const PEOPLE = [
  { id: 'ceo', name: 'Zara Khan', designation: 'CEO', department: 'Leadership' },
  { id: 'cto', name: 'Asha Rao', designation: 'CTO', department: 'Engineering', managerId: 'ceo' },
  { id: 'coo', name: 'Bilal Shah', designation: 'COO', department: 'Operations', managerId: 'ceo' },
  {
    id: 'se1',
    name: 'Chen Li',
    designation: 'Engineer',
    department: 'Engineering',
    managerId: 'cto',
  },
  {
    id: 'se2',
    name: 'Dev Patel',
    designation: 'Engineer',
    department: 'Engineering',
    managerId: 'cto',
  },
  {
    id: 'ops',
    name: 'Ema Roy',
    designation: 'Analyst',
    department: 'Operations',
    managerId: 'coo',
  },
];

const mount = () =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <OrgFlowChart trees={buildOrgTree(PEOPLE).trees} onOpen={cy.stub().as('open')} />
    </ThemeProvider>,
  );

describe('OrgFlowChart', () => {
  it('draws every person and a line to each report', () => {
    mount();
    PEOPLE.forEach((person) => cy.contains(person.name).should('be.visible'));
    cy.get('.react-flow__edge').should('have.length', PEOPLE.length - 1);
    cy.screenshot('org-flow-chart', { capture: 'viewport' });
  });

  it('opens a person from their card', () => {
    mount();
    cy.get('[aria-label="Open Chen Li"]').click();
    cy.get('@open').should('have.been.calledWith', 'se1');
  });
});
