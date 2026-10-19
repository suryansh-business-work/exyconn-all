import {
  assertPictures,
  crmProfileResolvers,
  withPrimaries,
  type PointsInput,
} from '../../../../src/modules/crm/crm.profile';

const { Contact, Company } = crmProfileResolvers;

describe('email and phone lists', () => {
  it('drops blanks and repeats and keeps the chosen primary', () => {
    const saved = withPrimaries<PointsInput>(
      {
        emails: [
          { address: ' Asha@Acme.com ', label: 'Work' },
          { address: 'asha@acme.com', label: 'Copy' },
          { address: '  ' },
          { address: 'asha@gmail.com', label: 'Home', primary: true },
        ],
        phones: [{ number: '+91 1' }, { number: '+91 1' }, { number: '+91 2', primary: true }],
      },
      true,
    );

    expect(saved.emails).toEqual([
      { address: 'asha@acme.com', label: 'Work', primary: false },
      { address: 'asha@gmail.com', label: 'Home', primary: true },
    ]);
    expect(saved.email).toBe('asha@gmail.com');
    expect(saved.phones?.map((p) => p.primary)).toEqual([false, true]);
    expect(saved.phone).toBe('+91 2');
  });

  it('makes the first entry primary when none was chosen', () => {
    const saved = withPrimaries<PointsInput>(
      { emails: [{ address: 'a@x.com' }, { address: 'b@x.com' }] },
      true,
    );
    expect(saved.email).toBe('a@x.com');
    expect(saved.emails?.map((p) => p.primary)).toEqual([true, false]);
  });

  it('turns the single email and phone an older caller sends into one-entry lists', () => {
    expect(withPrimaries<PointsInput>({ email: 'A@X.com', phone: '+911' }, true)).toMatchObject({
      email: 'a@x.com',
      phone: '+911',
      emails: [{ address: 'a@x.com', label: 'Work', primary: true }],
      phones: [{ number: '+911', label: 'Work', primary: true }],
    });
  });

  it('leaves both empty when nothing was given, unless an email is required', () => {
    expect(withPrimaries<PointsInput>({ email: null, phone: '' }, false)).toMatchObject({
      emails: [],
      phones: [],
      email: '',
      phone: '',
    });
    expect(() => withPrimaries<PointsInput>({}, true)).toThrow('Add at least one email address.');
  });
});

describe('pictures', () => {
  it('accepts a blank or http(s) picture and refuses anything else', () => {
    expect(() => assertPictures({ logoUrl: '', avatarUrl: null })).not.toThrow();
    expect(() => assertPictures({ logoUrl: ' https://ik.imagekit.io/a.png ' })).not.toThrow();
    expect(() => assertPictures({ avatarUrl: 'javascript:alert(1)' })).toThrow(
      'A picture must be a web address (http or https). Upload it again.',
    );
  });
});

describe('profile fields on older rows', () => {
  it('shows the one email or phone of a record saved before the lists', () => {
    const old = { email: 'a@x.com', phone: '+911', emails: [], phones: [] };
    expect(Contact.emails(old)).toEqual([{ address: 'a@x.com', label: 'Work', primary: true }]);
    expect(Contact.phones(old)).toEqual([{ number: '+911', label: 'Work', primary: true }]);
    expect(Company.emails({})).toEqual([]);
    expect(Company.phones({})).toEqual([]);
  });

  it('shows the saved lists when there are some', () => {
    const emails = [
      { address: 'a@x.com', primary: false },
      { address: 'b@x.com', primary: true },
    ];
    const phones = [{ number: '+911', primary: true }];
    expect(Contact.emails({ emails })).toBe(emails);
    expect(Contact.phones({ phones })).toBe(phones);
    expect(Company.email({ emails })).toBe('b@x.com');
    expect(Company.email({ emails: [{ address: 'a@x.com', primary: false }] })).toBe('');
  });

  it('reads missing fields as their defaults and stored ones as saved', () => {
    expect(Contact.website({})).toBe('');
    expect(Contact.city({ city: 'Pune' })).toBe('Pune');
    expect(Contact.lifecycleStage({})).toBe('LEAD');
    expect(Contact.lifecycleStage({ lifecycleStage: 'CUSTOMER' })).toBe('CUSTOMER');
    expect(Contact.languages({})).toEqual([]);
    expect(Contact.languages({ languages: ['en'] })).toEqual(['en']);
    expect(Company.annualRevenue({})).toBeNull();
    expect(Company.employeeCount({ employeeCount: 40 })).toBe(40);
  });
});
