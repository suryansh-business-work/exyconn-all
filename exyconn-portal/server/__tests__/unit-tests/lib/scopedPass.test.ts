import jwt from 'jsonwebtoken';
import { readPass, signPass } from '../../../src/lib/scopedPass';
import { derivedKey } from '../../../src/utils/derivedKey';
import { signToken } from '../../../src/utils/jwt';
import { ROLES } from '../../../src/constants/roles';

const claims = { sub: 'contact-1', tv: 3 };

describe('scoped passes', () => {
  it('reads back what it signed', () => {
    const pass = signPass('client-hub', claims);
    expect(readPass('client-hub', pass)).toEqual(claims);
    expect((jwt.decode(pass) as jwt.JwtPayload).exp).toBeUndefined();
  });

  it('carries an expiry when one is given', () => {
    const pass = signPass('website-chat', claims, '30d');
    const decoded = jwt.decode(pass) as jwt.JwtPayload;
    expect(decoded.exp).toBeGreaterThan(decoded.iat ?? 0);
    expect(readPass('website-chat', pass)).toEqual(claims);
  });

  it('never accepts one kind of pass as another', () => {
    const pass = signPass('whatsapp-demo-visitor', claims);
    expect(readPass('client-hub', pass)).toBeNull();
    expect(readPass('cms-preview', pass)).toBeNull();
  });

  it('never accepts a portal session as a pass', () => {
    const session = signToken({ id: 'u1', email: 'u@example.com', roles: [ROLES.ADMIN] });
    expect(readPass('client-hub', session)).toBeNull();
  });

  it('refuses an expired pass and garbage', () => {
    const expired = jwt.sign({ tv: 1 }, derivedKey('client-hub'), {
      algorithm: 'HS256',
      audience: 'client-hub',
      issuer: 'exyconn-portal',
      subject: 'contact-1',
      expiresIn: -10,
    });
    expect(readPass('client-hub', expired)).toBeNull();
    expect(readPass('client-hub', 'not-a-token')).toBeNull();
  });

  it('refuses a correctly signed pass that lacks its claims', () => {
    const options = {
      algorithm: 'HS256' as const,
      audience: 'client-hub',
      issuer: 'exyconn-portal',
    };
    const noVersion = jwt.sign({}, derivedKey('client-hub'), { ...options, subject: 'contact-1' });
    const textVersion = jwt.sign({ tv: '1' }, derivedKey('client-hub'), {
      ...options,
      subject: 'contact-1',
    });
    const noSubject = jwt.sign({ tv: 1 }, derivedKey('client-hub'), options);
    expect(readPass('client-hub', noVersion)).toBeNull();
    expect(readPass('client-hub', textVersion)).toBeNull();
    expect(readPass('client-hub', noSubject)).toBeNull();
  });
});
