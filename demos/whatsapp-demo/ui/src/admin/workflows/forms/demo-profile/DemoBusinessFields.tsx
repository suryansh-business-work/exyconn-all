import { ACCENT_KEYS, ICON_KEYS } from '@exyconn/wa-flow';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { CountedField } from '../../editor/inspector/fields/CountedField';
import { KeySelect } from '../../editor/inspector/fields/KeySelect';

/** Schema limits (schema.ts `businessSchema`). */
const MAX = {
  name: 80,
  tagline: 120,
  category: 60,
  about: 500,
  phone: 40,
  email: 120,
  website: 200,
  address: 200,
  hours: 120,
} as const;

/** The business the demo plays: its WhatsApp profile card. */
export function DemoBusinessFields() {
  return (
    <>
      <CountedField name="business.name" label="Business name" max={MAX.name} />
      <CountedField name="business.tagline" label="Tagline" max={MAX.tagline} />
      <CountedField name="business.category" label="Category" max={MAX.category} />
      <CountedField name="business.about" label="About" max={MAX.about} multiline />
      <KeySelect name="business.icon" label="Icon" keys={ICON_KEYS} icons />
      <KeySelect name="business.accent" label="Accent" keys={ACCENT_KEYS} />
      <RhfSwitch name="business.verified" label="Verified business badge" />
      <CountedField name="business.phone" label="Phone" max={MAX.phone} hint="A dummy number" />
      <CountedField
        name="business.email"
        label="Email"
        max={MAX.email}
        hint="Use a .example domain"
      />
      <CountedField name="business.website" label="Website" max={MAX.website} />
      <CountedField name="business.address" label="Address" max={MAX.address} multiline />
      <CountedField name="business.hours" label="Opening hours" max={MAX.hours} />
    </>
  );
}
