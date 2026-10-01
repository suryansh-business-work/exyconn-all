import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Flex } from '@/components/ui';
import { RhfFieldArrayError, RhfTextField } from './index';

const schema = z.object({
  lines: z
    .array(z.object({ description: z.string().min(1, 'Describe the line') }))
    .min(1, 'Add at least one line')
    .refine(
      (lines) => new Set(lines.map((line) => line.description)).size === lines.length,
      'Two lines cannot read the same',
    ),
});
type Values = z.infer<typeof schema>;

function Harness() {
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { lines: [] } });
  const { fields, append } = useFieldArray({ control: methods.control, name: 'lines' });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)} noValidate>
        {fields.map((field, index) => (
          <RhfTextField key={field.id} name={`lines.${index}.description`} label="Description" />
        ))}
        <RhfFieldArrayError name="lines" />
        {/* MUI buttons rather than bare ones: two adjacent native buttons are too small and
            too close for WCAG 2.2 target-size, which the axe check after every spec enforces. */}
        <Flex direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => append({ description: '' })}>
            Add line
          </Button>
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </Flex>
      </form>
    </FormProvider>
  );
}

describe('RhfFieldArrayError', () => {
  it('says nothing until something is wrong', () => {
    cy.mount(<Harness />);
    cy.contains('Add at least one line').should('not.exist');
  });

  /** An empty array carries its message on the array node itself. */
  it('shows why an empty array is not enough', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.contains('Add at least one line').should('be.visible');
  });

  /** With rows present the same message lives under `root`, beside the per-row errors. */
  it('shows a rule about the rows together, which no single row could show', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Add line').click();
    cy.contains('button', 'Add line').click();
    cy.get('input[name="lines.0.description"]').type('Consulting');
    cy.get('input[name="lines.1.description"]').type('Consulting');
    cy.contains('button', 'Submit').click();
    cy.contains('Two lines cannot read the same').should('be.visible');
  });

  it('leaves a row to report its own error', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Add line').click();
    cy.contains('button', 'Submit').click();
    cy.contains('Describe the line').should('be.visible');
    cy.contains('Add at least one line').should('not.exist');
  });

  /**
   * On the next attempt, not on the keystroke: a rule about the rows together is checked when
   * the whole schema runs, and after a failed submit React Hook Form re-checks the field that
   * changed rather than the array it belongs to.
   */
  it('goes on the next attempt, once the rows are put right', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Add line').click();
    cy.contains('button', 'Add line').click();
    cy.get('input[name="lines.0.description"]').type('Consulting');
    cy.get('input[name="lines.1.description"]').type('Consulting');
    cy.contains('button', 'Submit').click();
    cy.contains('Two lines cannot read the same').should('be.visible');

    cy.get('input[name="lines.1.description"]').clear().type('Travel');
    cy.contains('button', 'Submit').click();
    cy.contains('Two lines cannot read the same').should('not.exist');
  });

  it('is announced when it appears, rather than only being visible', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.get('[role="alert"]').should('contain', 'Add at least one line');
  });
});
