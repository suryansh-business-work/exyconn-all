import { LIMITS } from '@exyconn/wa-flow';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { CountedField } from '../../editor/inspector/fields/CountedField';

/** Schema limit (schema.ts `demoSchema.industry`). */
const INDUSTRY_MAX = 60;

/** The demo itself: its URL key, industry, greeting and menu, position and visibility. */
export function DemoChatFields({ isEdit }: Readonly<{ isEdit: boolean }>) {
  return (
    <>
      <RhfTextField
        name="key"
        label="Key"
        disabled={isEdit}
        helperText={isEdit ? 'Fixed once created: it is the demo’s web address' : 'e.g. retail'}
      />
      <CountedField name="industry" label="Industry" max={INDUSTRY_MAX} />
      <CountedField
        name="greeting"
        label="Greeting"
        max={LIMITS.text}
        multiline
        hint="Sent first, e.g. Hi {{user.firstName}}"
      />
      <CountedField name="menuText" label="Menu message" max={LIMITS.text} multiline />
      <CountedField name="menuButton" label="Menu button" max={LIMITS.buttonTitle} />
      <RhfTextField
        name="order"
        label="Position in the chat list"
        type="number"
        helperText="0 comes first"
      />
      <RhfSwitch name="active" label="Shown in the chat app" />
    </>
  );
}
