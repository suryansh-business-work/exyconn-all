/**
 * Types a date into a MUIX date field.
 *
 * MUI X 9 stopped rendering a date field as one editable `<input>`. What is on screen is a
 * `role="group"` of contenteditable sections (DD, MM, YYYY); the `input[name="…"]` a spec
 * reaches for is a hidden, `tabindex="-1"` clone that only carries the value to the form —
 * `cy.type()` on it fails as "covered by another element". So the keystrokes go to the
 * first section, exactly where a person clicking the field would put them.
 *
 * `digits` is unseparated (`'12012026'`), because the field advances between sections on
 * its own and typing the separators would fight it.
 */
Cypress.Commands.add('typeDate', (name: string, digits: string) => {
  cy.get(`input[name="${name}"]`)
    .closest('[role="group"]')
    .find('.MuiPickersSectionList-sectionContent')
    .first()
    .click()
    .type(digits);
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      typeDate: (name: string, digits: string) => void;
    }
  }
}

export {};
