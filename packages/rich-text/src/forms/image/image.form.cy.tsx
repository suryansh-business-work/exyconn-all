import { ImageForm, IMAGE_MESSAGES } from './image.form';

const UPLOADED_URL = 'https://ik.imagekit.io/exyconn/media/team-offsite.png';

/** A 1×1 PNG, enough for the file input to hand the form a real File. */
const PNG = Cypress.Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const mount = (uploadImage: (file: File) => Promise<string>) =>
  cy.mount(
    <ImageForm
      uploadImage={uploadImage}
      onSubmit={cy.stub().as('submit')}
      onClose={cy.stub().as('close')}
    />,
  );

describe('ImageForm', () => {
  it('requires an image and its alt text', () => {
    mount(cy.stub().resolves(UPLOADED_URL));
    cy.contains('button', 'Insert').click();
    cy.contains(IMAGE_MESSAGES.srcRequired).should('be.visible');
    cy.contains(IMAGE_MESSAGES.altRequired).should('be.visible');
    cy.get('@submit').should('not.have.been.called');
  });

  it('only accepts a full web address', () => {
    mount(cy.stub().resolves(UPLOADED_URL));
    cy.get('input[name="src"]').type('ftp://example.com/a.png');
    cy.get('input[name="alt"]').type('A picture');
    cy.contains('button', 'Insert').click();
    cy.contains(IMAGE_MESSAGES.srcInvalid).should('be.visible');
  });

  it('uploads a file, fills the URL and suggests alt text', () => {
    const upload = cy.stub().as('upload').resolves(UPLOADED_URL);
    mount(upload);
    cy.get('input[type="file"]').selectFile(
      { contents: PNG, fileName: 'team-offsite.png', mimeType: 'image/png' },
      { force: true },
    );
    cy.get('@upload').should('have.been.calledOnce');
    cy.get('input[name="src"]').should('have.value', UPLOADED_URL);
    cy.get('input[name="alt"]').should('have.value', 'team offsite');
    cy.contains('button', 'Insert').click();
    cy.get('@submit').should('have.been.calledWithMatch', {
      src: UPLOADED_URL,
      alt: 'team offsite',
      title: '',
    });
  });

  it('shows why an upload failed', () => {
    mount(cy.stub().rejects(new Error('Image must be 5 MB or smaller')));
    cy.get('input[type="file"]').selectFile(
      { contents: PNG, fileName: 'huge.png', mimeType: 'image/png' },
      { force: true },
    );
    cy.contains('Image must be 5 MB or smaller').should('be.visible');
  });

  it('inserts an image that is already hosted', () => {
    mount(cy.stub().resolves(UPLOADED_URL));
    cy.get('input[name="src"]').type('https://images.example.com/chart.png');
    cy.get('input[name="alt"]').type('Quarterly revenue chart');
    cy.get('input[name="title"]').type('Q3');
    cy.contains('button', 'Insert').click();
    cy.get('@submit').should('have.been.calledWithMatch', {
      src: 'https://images.example.com/chart.png',
      alt: 'Quarterly revenue chart',
      title: 'Q3',
    });
  });
});
