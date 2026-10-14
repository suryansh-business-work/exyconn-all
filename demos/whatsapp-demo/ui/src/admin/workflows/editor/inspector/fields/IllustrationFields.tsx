import { ACCENT_KEYS, ICON_KEYS, LIMITS } from '@exyconn/wa-flow';
import { CountedField } from './CountedField';
import { KeySelect } from './KeySelect';

interface IllustrationFieldsProps {
  /** Path of the illustration, e.g. `image` or `cards.0.image`. */
  name: string;
}

/** An illustration: an icon on an accent tint, with an optional title and subtitle. */
export function IllustrationFields({ name }: Readonly<IllustrationFieldsProps>) {
  return (
    <>
      <KeySelect name={`${name}.icon`} label="Icon" keys={ICON_KEYS} icons />
      <KeySelect name={`${name}.accent`} label="Accent" keys={ACCENT_KEYS} />
      <CountedField name={`${name}.title`} label="Picture title" max={LIMITS.header} />
      <CountedField name={`${name}.subtitle`} label="Picture subtitle" max={LIMITS.header} />
    </>
  );
}
