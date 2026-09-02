import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfMultiSelect } from './index';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  tags: z.array(z.string()).min(1, 'Pick at least one tag'),
});
type Values = z.infer<typeof schema>;

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

function Harness() {
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', role: '', tags: [] },
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)} noValidate>
        <RhfTextField name="name" label="Name" />
        <RhfSelect name="role" label="Role" options={options} />
        <RhfMultiSelect name="tags" label="Tags" options={options} />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

describe('RHF field wrappers', () => {
  it('surfaces validation errors for text, select and multi-select on submit', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Role is required').should('be.visible');
    cy.contains('Pick at least one tag').should('be.visible');
  });

  it('clears the text error once a value is typed', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.contains('Name is required').should('be.visible');
    cy.get('input[name="name"]').type('Jordan');
    cy.contains('Name is required').should('not.exist');
  });
});
