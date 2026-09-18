import FormControlLabel from '@mui/material/FormControlLabel';
import { ThemeProvider } from '../tokens/ThemeProvider';
import { Switch } from './Switch';

describe('Switch (branded)', () => {
  it('renders unchecked by default', () => {
    cy.mount(
      <Switch
        slotProps={{
          input: { 'aria-label': 'enabled' },
        }}
      />,
    );
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('toggles checked state and fires onChange on click', () => {
    const onChange = cy.stub().as('change');
    cy.mount(
      <Switch
        onChange={onChange}
        slotProps={{
          input: { 'aria-label': 'enabled' },
        }}
      />,
    );
    cy.get('input[type="checkbox"]').click();
    cy.get('@change').should('have.been.calledOnce');
    cy.get('input[type="checkbox"]').should('be.checked');
  });
});

/** The rendered box of the first element `selector` finds. */
const box = (selector: string) => cy.get(selector).then(($el) => $el[0].getBoundingClientRect());

describe('Switch with a label', () => {
  beforeEach(() => {
    cy.mount(
      <ThemeProvider>
        <div style={{ display: 'flex' }}>
          <span id="before">Before</span>
          <FormControlLabel control={<Switch defaultChecked />} label="Approve" />
          <FormControlLabel control={<Switch />} label="Create" />
        </div>
      </ThemeProvider>,
    );
  });

  it('never slides over what comes before it', () => {
    box('#before').then((before) => {
      box('.MuiSwitch-root').then((track) => {
        expect(track.left).to.be.at.least(before.right);
      });
    });
  });

  it('keeps its label clear of the track', () => {
    box('.MuiSwitch-root').then((track) => {
      box('.MuiFormControlLabel-label').then((label) => {
        expect(label.left - track.right).to.be.at.least(8);
      });
    });
  });

  it('leaves room between one labelled switch and the next', () => {
    cy.get('.MuiFormControlLabel-label').then(($labels) => {
      const first = $labels[0].getBoundingClientRect();
      cy.get('.MuiSwitch-root').then(($tracks) => {
        expect($tracks[1].getBoundingClientRect().left - first.right).to.be.at.least(16);
      });
    });
  });
});
