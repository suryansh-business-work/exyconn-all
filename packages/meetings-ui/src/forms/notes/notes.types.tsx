import type { MaNotesQuery } from '@exyconn/shell/graphql/generated';

/** The notes being edited, as the summary tab loaded them. */
export type EditableNotes = Pick<NonNullable<MaNotesQuery['maNotes']>, 'version' | 'content'>;

/** The form's values: prose as it is, each list as one item per line. */
export interface NotesFormValues {
  overview: string;
  executiveSummary: string;
  agenda: string;
  discussionPoints: string;
  risks: string;
  blockers: string;
  openQuestions: string;
  followUps: string;
  nextTopics: string;
}
