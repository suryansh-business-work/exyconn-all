import { readChatPass, signChatPass } from '../../../../src/modules/website-chat/chat.token';
import { signPass } from '../../../../src/lib/scopedPass';

describe('chat pass', () => {
  it('round-trips the session and its token version', () => {
    const pass = signChatPass('64b7f0c2a1b2c3d4e5f60718', 2);
    expect(readChatPass(pass)).toEqual({ sessionId: '64b7f0c2a1b2c3d4e5f60718', tv: 2 });
  });

  it('refuses a forged pass', () => {
    expect(readChatPass('not-a-pass')).toBeNull();
  });

  it('refuses a pass signed for another purpose', () => {
    const other = signPass('client-hub', { sub: 's1', tv: 0 }, '30d');
    expect(readChatPass(other)).toBeNull();
  });
});
