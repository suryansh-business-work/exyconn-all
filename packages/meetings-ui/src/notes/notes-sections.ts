import type { MaNotesContentFieldsFragment } from '@exyconn/shell/graphql/generated';

export type NotesContent = Omit<MaNotesContentFieldsFragment, '__typename'>;

/** The notes' list sections, in the order they are read, shown, edited and exported. */
export const LIST_SECTIONS = [
  { key: 'agenda', label: 'Agenda' },
  { key: 'discussionPoints', label: 'Discussion points' },
  { key: 'risks', label: 'Risks' },
  { key: 'blockers', label: 'Blockers' },
  { key: 'openQuestions', label: 'Open questions' },
  { key: 'followUps', label: 'Follow-ups' },
  { key: 'nextTopics', label: 'Topics for next time' },
] as const satisfies ReadonlyArray<{ key: keyof NotesContent; label: string }>;

export type ListSectionKey = (typeof LIST_SECTIONS)[number]['key'];

/** The notes' prose sections. */
export const TEXT_SECTIONS = [
  { key: 'executiveSummary', label: 'Executive summary' },
  { key: 'overview', label: 'Overview' },
] as const satisfies ReadonlyArray<{ key: keyof NotesContent; label: string }>;

/** A copy of the content without Apollo's `__typename`, as the mutation input takes it. */
export function plainContent(content: NotesContent): NotesContent {
  return {
    overview: content.overview,
    executiveSummary: content.executiveSummary,
    agenda: content.agenda,
    discussionPoints: content.discussionPoints,
    risks: content.risks,
    blockers: content.blockers,
    openQuestions: content.openQuestions,
    followUps: content.followUps,
    nextTopics: content.nextTopics,
  };
}
