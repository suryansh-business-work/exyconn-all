import { robotsAllows } from '../../../../src/modules/google-maps/robots';

const AGENT = 'ExyconnLeadBot';

describe('robotsAllows', () => {
  it('allows everything when there is no robots.txt or no group applies', () => {
    expect(robotsAllows('', AGENT, '/contact')).toBe(true);
    expect(robotsAllows('User-agent: OtherBot\nDisallow: /', AGENT, '/contact')).toBe(true);
  });

  it('uses our own group over the * group', () => {
    const txt = ['User-agent: *', 'Disallow: /', '', 'User-agent: exyconnleadbot', 'Allow: /'].join(
      '\n',
    );
    expect(robotsAllows(txt, AGENT, '/contact')).toBe(true);
    expect(robotsAllows(txt, 'SomeoneElse', '/contact')).toBe(false);
  });

  it('lets consecutive User-agent lines share a group', () => {
    const txt = 'User-agent: GoogleBot\nUser-agent: ExyconnLeadBot\nDisallow: /private';
    expect(robotsAllows(txt, AGENT, '/private/x')).toBe(false);
    expect(robotsAllows(txt, AGENT, '/public')).toBe(true);
  });

  it('lets the longest matching rule win, and an Allow win a tie', () => {
    const txt = [
      'User-agent: *',
      'Disallow: /shop',
      'Allow: /shop/contact',
      'Disallow: /about',
      'Allow: /about',
      'Disallow: /about-us/team',
      'Allow: /about-us',
    ].join('\r\n');
    expect(robotsAllows(txt, AGENT, '/shop/cart')).toBe(false);
    expect(robotsAllows(txt, AGENT, '/shop/contact')).toBe(true);
    expect(robotsAllows(txt, AGENT, '/about')).toBe(true);
    expect(robotsAllows(txt, AGENT, '/about-us/team')).toBe(false);
    expect(robotsAllows(txt, AGENT, '/about-us/history')).toBe(true);
  });

  it('keeps the first of two equal Disallows and ignores a shorter later rule', () => {
    const txt = 'User-agent: *\nDisallow: /a/b\nDisallow: /a/b\nAllow: /a';
    expect(robotsAllows(txt, AGENT, '/a/b/c')).toBe(false);
  });

  it('ignores comments, junk lines, rules before any group and an empty Disallow', () => {
    const txt = [
      'Disallow: /early',
      '# a comment line',
      'no colon here',
      ': no field',
      'Sitemap: https://acme.example/sitemap.xml',
      'User-agent: * # everyone',
      'Disallow:',
    ].join('\n');
    expect(robotsAllows(txt, AGENT, '/early')).toBe(true);
    expect(robotsAllows(txt, AGENT, '/anything')).toBe(true);
  });

  it('cuts a comment at its first # in one pass, even after a long run of them', () => {
    const txt = `User-agent: *\nDisallow: /private${'#'.repeat(50_000)} note`;
    expect(robotsAllows(txt, AGENT, '/private/page')).toBe(false);
    expect(robotsAllows(txt, AGENT, '/public')).toBe(true);
  });

  it('keeps a # that a later carriage return on the same line puts out of reach', () => {
    // As `/#.*$/` did: `.` stops at the \r, so only a # after the last line break starts a comment.
    const txt = 'User-agent: *\nDisallow: /a#b\r/c#d';
    expect(robotsAllows(txt, AGENT, '/a#b\r/c')).toBe(false);
    expect(robotsAllows(txt, AGENT, '/a')).toBe(true);
  });

  it('reads a wildcard rule only up to the *, erring towards staying out', () => {
    const txt = 'User-agent: *\nDisallow: /*.pdf\nAllow: *';
    expect(robotsAllows(txt, AGENT, '/brochure.html')).toBe(false);
  });
});
