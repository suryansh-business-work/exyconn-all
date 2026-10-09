import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { fakePeer, framesOf } from './chat.fixtures';

const frame = { t: 'hello', n: 1 };

afterEach(() => {
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

describe('chatHub', () => {
  it('delivers to an open socket only', () => {
    const open = fakePeer();
    const closed = fakePeer({}, 3);
    chatHub.send(open.peer, frame);
    chatHub.send(closed.peer, frame);
    expect(framesOf(open.socket)).toEqual([frame]);
    expect(closed.socket.send).not.toHaveBeenCalled();
  });

  it('tracks who joined and left', () => {
    const { peer } = fakePeer();
    chatHub.join(peer);
    expect(chatHub.all().has(peer)).toBe(true);
    chatHub.leave(peer);
    expect(chatHub.all().has(peer)).toBe(false);
  });

  it('routes frames to visitors, staff and watchers by role and session', () => {
    const mine = fakePeer({ role: 'visitor', sessionId: 's1' });
    const otherTab = fakePeer({ role: 'visitor', sessionId: 's1' });
    const stranger = fakePeer({ role: 'visitor', sessionId: 's2' });
    const anonymous = fakePeer({ role: 'visitor' });
    const watcher = fakePeer({ role: 'staff', watching: 's1' });
    const staff = fakePeer({ role: 'staff', watching: 's2' });
    const unknown = fakePeer();
    const everyone = [mine, otherTab, stranger, anonymous, watcher, staff, unknown];
    for (const { peer } of everyone) {
      chatHub.join(peer);
    }

    chatHub.toVisitors('s1', { t: 'a' });
    chatHub.toAllVisitors({ t: 'b' });
    chatHub.toStaff({ t: 'c' });
    chatHub.toWatchers('s1', { t: 'd' });

    const kinds = (entry: (typeof everyone)[number]) => framesOf(entry.socket).map((f) => f.t);
    expect(kinds(mine)).toEqual(['a', 'b']);
    expect(kinds(otherTab)).toEqual(['a', 'b']);
    expect(kinds(stranger)).toEqual(['b']);
    expect(kinds(anonymous)).toEqual(['b']);
    expect(kinds(watcher)).toEqual(['c', 'd']);
    expect(kinds(staff)).toEqual(['c']);
    expect(kinds(unknown)).toEqual([]);
  });
});
