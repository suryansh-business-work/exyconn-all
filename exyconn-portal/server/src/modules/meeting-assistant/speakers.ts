import type { MaMeetingDocument } from './models';

type Mappings = Pick<MaMeetingDocument, 'speakerMappings'>;

/** The confirmed name behind a label, when a person confirmed one. */
export function confirmedSpeaker(meeting: Mappings, label: string | null): string | null {
  if (!label) {
    return null;
  }
  return meeting.speakerMappings.find((mapping) => mapping.label === label)?.name ?? null;
}

/**
 * What a transcript line is attributed to: a confirmed name, else the original label, else
 * an honest "Unknown speaker". A diarization label is never turned into a name on a guess.
 */
export function speakerNameFor(meeting: Mappings, label: string | null): string {
  return confirmedSpeaker(meeting, label) ?? label ?? 'Unknown speaker';
}
