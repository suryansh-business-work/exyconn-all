// The catalogue as the home page's build sees it, without one chapter: the seed must refuse to
// load rather than render a home page with a hole in it.
jest.mock('@exyconn/cms', () => {
  const actual = jest.requireActual<typeof import('@exyconn/cms')>('@exyconn/cms');
  return {
    ...actual,
    cmsComponent: (key: string) => (key === 'home.closing' ? undefined : actual.cmsComponent(key)),
  };
});

describe('HOME_PAGE with a chapter missing from the catalogue', () => {
  it('fails to load, naming the missing component', () => {
    expect(() =>
      jest.requireActual('../../../../../../../src/modules/cms/seed/exyconn/pages/home'),
    ).toThrow('The CMS seed places "home.closing", which is not in the component catalogue.');
  });
});
