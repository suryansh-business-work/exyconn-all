import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { RhfSwitch } from './index';

const schema = z.object({
  agreed: z.boolean().refine((value) => value, 'Confirm that you agree to be bound by it'),
});
type Values = z.infer<typeof schema>;

function Harness() {
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { agreed: false },
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)} noValidate>
        <RhfSwitch name="agreed" label="I agree" />
        <Button type="submit" variant="contained">
          Submit
        </Button>
      </form>
    </FormProvider>
  );
}

describe('RhfSwitch', () => {
  it('shows nothing extra while the form is untouched', () => {
    cy.mount(<Harness />);
    cy.contains('Confirm that you agree').should('not.exist');
  });

  /**
   * A required switch used to block the submit in silence: the button did nothing and nobody
   * was told what was missing.
   */
  it('says why a required switch is stopping the submit', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.contains('Confirm that you agree to be bound by it').should('be.visible');
  });

  it('ties the message to the switch, so it is read out with the control', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.get('input[name="agreed"]')
      .invoke('attr', 'aria-describedby')
      .then((id) => {
        cy.get(`#${id}`).should('contain', 'Confirm that you agree to be bound by it');
      });
  });

  it('clears the message once the switch is on', () => {
    cy.mount(<Harness />);
    cy.contains('button', 'Submit').click();
    cy.contains('Confirm that you agree to be bound by it').should('be.visible');
    cy.get('input[name="agreed"]').check();
    cy.contains('Confirm that you agree to be bound by it').should('not.exist');
  });

  it('describes nothing while there is no error to describe', () => {
    cy.mount(<Harness />);
    cy.get('input[name="agreed"]').should('not.have.attr', 'aria-describedby');
  });
});
