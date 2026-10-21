import { MaScope } from '@exyconn/shell/graphql/generated';

/** Which meetings a screen covers: the viewer's own, or the whole company's (AI role). */
export type MeetingScope = 'MINE' | 'ALL';

/** What every Meeting Assistant screen is mounted with, so the AI and employee apps share them. */
export interface MeetingPageProps {
  scope: MeetingScope;
  /** Where the screens live in the app, e.g. `/ai/meeting-assistant` or `/me/meetings`. */
  basePath: string;
}

const SCOPES: Readonly<Record<MeetingScope, MaScope>> = { MINE: MaScope.Mine, ALL: MaScope.All };

/** The GraphQL scope argument for a screen's scope. */
export function toMaScope(scope: MeetingScope): MaScope {
  return SCOPES[scope];
}

/** The routes the screens link to, all under the app's base path. */
export function meetingPaths(basePath: string) {
  const list = `${basePath}/meetings`;
  return {
    list,
    detail: (id: string) => `${list}/${id}`,
    transcript: (id: string) => `${list}/${id}/transcript`,
    actions: `${basePath}/actions`,
    extension: `${basePath}/extension`,
  };
}
