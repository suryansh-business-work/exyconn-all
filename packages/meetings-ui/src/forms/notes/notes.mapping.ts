import { LIST_SECTIONS, type NotesContent } from '../../notes/notes-sections';
import type { NotesFormValues } from './notes.types';

/** One item per non-blank line, trimmed. */
const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/** The stored notes as form values. */
export function toFormValues(content: NotesContent): NotesFormValues {
  const values: NotesFormValues = {
    overview: content.overview,
    executiveSummary: content.executiveSummary,
    agenda: '',
    discussionPoints: '',
    risks: '',
    blockers: '',
    openQuestions: '',
    followUps: '',
    nextTopics: '',
  };
  for (const section of LIST_SECTIONS) {
    values[section.key] = content[section.key].join('\n');
  }
  return values;
}

/** The form values as the content `maUpdateNotes` saves. */
export function toNotesContent(values: NotesFormValues): NotesContent {
  return {
    overview: values.overview.trim(),
    executiveSummary: values.executiveSummary.trim(),
    agenda: lines(values.agenda),
    discussionPoints: lines(values.discussionPoints),
    risks: lines(values.risks),
    blockers: lines(values.blockers),
    openQuestions: lines(values.openQuestions),
    followUps: lines(values.followUps),
    nextTopics: lines(values.nextTopics),
  };
}
