import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { DepartmentCard } from './DepartmentCard';
import type { DepartmentRow } from '../forms/department';

const DEPARTMENT: DepartmentRow = {
  id: 'd1',
  name: 'Engineering',
  code: 'ENG',
  description: 'Product engineering and platform',
  headId: 'u1',
  headName: 'Asha Rao',
  positions: [
    {
      id: 'p1',
      name: 'Software Engineer',
      department: 'Engineering',
      code: 'SE',
      description: null,
      minSalary: 60000,
      maxSalary: 120000,
      grade: 'G3',
      employmentType: 'FT',
      headcount: 4,
      filled: 3,
      active: true,
    },
  ],
};

const mount = () =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <DepartmentCard
        department={DEPARTMENT}
        onEdit={cy.stub().as('edit')}
        onDelete={cy.stub().as('delete')}
        onAddPosition={cy.stub().as('add')}
        onEditPosition={cy.stub().as('editPosition')}
        onDeletePosition={cy.stub()}
      />
    </ThemeProvider>,
  );

describe('DepartmentCard', () => {
  it('summarises the department and lists its positions when expanded', () => {
    mount();
    cy.contains('Head: Asha Rao').should('be.visible');
    cy.contains('3 of 4 seats filled').should('be.visible');
    cy.contains('Engineering').click();
    cy.contains('Software Engineer').should('be.visible');
    cy.contains('3 / 4').should('be.visible');
    cy.screenshot('department-card', { capture: 'viewport' });
  });

  it('adds a position to this department', () => {
    mount();
    cy.contains('Engineering').click();
    cy.contains('button', 'Add position').click();
    cy.get('@add').should('have.been.calledWith', 'Engineering');
  });
});
