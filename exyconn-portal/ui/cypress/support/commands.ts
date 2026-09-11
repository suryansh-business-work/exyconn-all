/**
 * Types into a MUIX date or date-time field.
 *
 * MUI X 9 stopped rendering a picker as one editable `<input>`. What is on screen is a
 * `role="group"` of contenteditable sections (MM, DD, YYYY, …); the `input` a spec reaches
 * for — by name, or through the field's label — is a hidden, `tabindex="-1"` clone that only
 * carries the value to the form, so `cy.type()` on it fails as "covered by another element".
 * This puts the keystrokes on the first section, where a person clicking the field would.
 *
 * It is a child command, so it works from whichever handle a spec already had:
 *
 *     cy.get('input[name="dueDate"]').typeDate('12012026');
 *     cy.contains('label', 'Started').parent().typeDate('090320260500PM');
 *
 * Pass the value unseparated — the field moves between sections on its own, and typing the
 * slashes and colons would fight it. Letters still work where a section wants one (`PM`).
 */
Cypress.Commands.add(
  'typeDate',
  { prevSubject: 'element' },
  (subject: JQuery<HTMLElement>, value: string) => {
    cy.wrap(subject)
      .closest('[role="group"]')
      .find('.MuiPickersSectionList-sectionContent')
      .first()
      .click()
      .type(value);
  },
);

/**
 * A field's label, whichever element MUI put it in.
 *
 * MUI 9 renders the label of a non-native `select` as a `<div>` rather than a `<label>` —
 * there is no form control for a `for` to point at — so `cy.contains('label', …)` finds
 * nothing on exactly the fields a spec most wants to assert about. The MUI class is on both.
 */
Cypress.Commands.add('fieldLabel', (text: string) =>
  cy.contains('label, .MuiInputLabel-root', text),
);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      typeDate: (value: string) => Chainable<JQuery<HTMLElement>>;
      fieldLabel: (text: string) => Chainable<JQuery<HTMLElement>>;
    }
  }
}

export {};
