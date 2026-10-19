import { useT } from '@exyconn/i18n';
import { ColdEmailTone } from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

/** The tones a cold email can be written in. Configuration, not business data. */
const TONES: ReadonlyArray<{ value: ColdEmailTone; label: string }> = [
  { value: ColdEmailTone.Friendly, label: 'Friendly' },
  { value: ColdEmailTone.Formal, label: 'Formal' },
  { value: ColdEmailTone.Brief, label: 'Brief' },
];

/** The tone select's options, translated. */
export function useToneOptions(): SelectOption[] {
  const t = useT();
  return TONES.map((tone) => ({ value: tone.value, label: t(tone.label) }));
}

/** A tone's translated label, for showing it next to a version. */
export function useToneLabel() {
  const t = useT();
  return (tone: ColdEmailTone) => t(TONES.find((option) => option.value === tone)?.label ?? tone);
}
