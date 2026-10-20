import { describe, expect, it } from 'vitest';
import { MaScope } from '@exyconn/shell/graphql/generated';
import { meetingPaths, toMaScope } from '../../../src/lib/scope';

describe('toMaScope', () => {
  it("maps a screen's scope to the GraphQL argument", () => {
    expect(toMaScope('ALL')).toBe(MaScope.All);
    expect(toMaScope('MINE')).toBe(MaScope.Mine);
  });
});

describe('meetingPaths', () => {
  it('builds every route under the base path', () => {
    const paths = meetingPaths('/ai/meeting-assistant');
    expect(paths.list).toBe('/ai/meeting-assistant/meetings');
    expect(paths.detail('m1')).toBe('/ai/meeting-assistant/meetings/m1');
    expect(paths.transcript('m1')).toBe('/ai/meeting-assistant/meetings/m1/transcript');
    expect(paths.actions).toBe('/ai/meeting-assistant/actions');
    expect(paths.extension).toBe('/ai/meeting-assistant/extension');
  });
});
