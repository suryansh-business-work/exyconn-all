import { useFormContext, useWatch } from 'react-hook-form';
import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KindSwitch } from '../../fields/KindSwitch';
import { NumberField } from '../../fields/NumberField';
import { ctaStarter, type CtaKind } from './cta-starter';

/** Schema limits (schema.ts `ctaActionSchema`). */
const MAX = { title: 25, url: 500, phone: 40, eventTitle: 120, start: 120, location: 200 } as const;

const KIND_LABELS: Readonly<Record<CtaKind, string>> = {
  url: 'Open a link',
  call: 'Call a number',
  calendar: 'Add to calendar',
};

function CalendarFields({ name }: Readonly<{ name: string }>) {
  return (
    <>
      <CountedField name={`${name}.event.title`} label="Event title" max={MAX.eventTitle} />
      <CountedField
        name={`${name}.event.start`}
        label="Starts at"
        max={MAX.start}
        hint="A variable holding the time, e.g. {{slot}}"
      />
      <NumberField
        name={`${name}.event.durationMin`}
        label="Duration (minutes)"
        hint="5 to 1,440"
      />
      <CountedField name={`${name}.event.location`} label="Event location" max={MAX.location} />
    </>
  );
}

const switchKind = (kind: string, current: Record<string, unknown>) =>
  ctaStarter(kind as CtaKind, String(current.title ?? ''));

/** One call-to-action button: a link, a phone call or a calendar event. */
export function CtaActionItem({ name }: Readonly<ArrayItemProps>) {
  const { control } = useFormContext();
  const kind = useWatch({ control, name: `${name}.kind` }) as CtaKind;

  return (
    <>
      <KindSwitch name={name} label="Action" kinds={KIND_LABELS} starter={switchKind} />
      <CountedField name={`${name}.title`} label="Button title" max={MAX.title} />
      {kind === 'url' && (
        <CountedField
          name={`${name}.url`}
          label="Link"
          max={MAX.url}
          hint="https://… or a {{var}}"
        />
      )}
      {kind === 'call' && <CountedField name={`${name}.phone`} label="Phone" max={MAX.phone} />}
      {kind === 'calendar' && <CalendarFields name={name} />}
    </>
  );
}
