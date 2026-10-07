import {
  VISITOR_HEADER,
  readVisitorPass,
  signVisitorPass,
} from '../../../../../src/modules/whatsapp-demo/visitor/visitor.token';
import { signPass } from '../../../../../src/lib/scopedPass';

describe('visitor pass', () => {
  it('reads back the visitor and token version it was signed with', () => {
    expect(readVisitorPass(signVisitorPass('visitor-1', 3))).toEqual({ vid: 'visitor-1', tv: 3 });
  });

  it('refuses another kind of pass and anything unsigned', () => {
    expect(readVisitorPass(signPass('client-hub', { sub: 'visitor-1', tv: 3 }))).toBeNull();
    expect(readVisitorPass('garbage')).toBeNull();
  });

  it('travels in the x-demo-visitor header', () => {
    expect(VISITOR_HEADER).toBe('x-demo-visitor');
  });
});
