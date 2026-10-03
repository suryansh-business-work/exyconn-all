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

describe('Switch size', () => {
  beforeEach(() => {
    cy.mount(
      <ThemeProvider>
        <Switch slotProps={{ input: { 'aria-label': 'enabled' } }} />
      </ThemeProvider>,
    );
  });

  it('draws a compact 36×20 track', () => {
    box('.MuiSwitch-root').then((track) => {
      expect(track.width).to.equal(36);
      expect(track.height).to.equal(20);
    });
  });

  it('keeps a pointer target of at least 24×24 (SC 2.5.8)', () => {
    box('input[type="checkbox"]').then((target) => {
      expect(target.width).to.be.at.least(24);
      expect(target.height).to.be.at.least(24);
    });
  });
});

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

describe('Switch thumb', () => {
  /** The thumb sits inside the track, inset evenly, wherever it rests. */
  const expectThumbInside = () => {
    box('.MuiSwitch-root').then((track) => {
      box('.MuiSwitch-thumb').then((thumb) => {
        expect(thumb.left).to.be.at.least(track.left);
        expect(thumb.right).to.be.at.most(track.right);
        expect(thumb.top).to.be.at.least(track.top);
        expect(thumb.bottom).to.be.at.most(track.bottom);
        expect(thumb.top - track.top).to.be.closeTo(track.bottom - thumb.bottom, 0.5);
      });
    });
  };

  for (const size of ['medium', 'small'] as const) {
    for (const checked of [false, true]) {
      it(`stays inside a ${size} track when ${checked ? 'on' : 'off'}`, () => {
        cy.mount(
          <ThemeProvider>
            <Switch
              size={size}
              checked={checked}
              slotProps={{ input: { 'aria-label': 'enabled' } }}
            />
          </ThemeProvider>,
        );
        expectThumbInside();
      });
    }
  }
});
