import { useFormContext } from 'react-hook-form';
import { screen } from '@testing-library/react';

interface StubFieldProps {
  name: string;
  label: string;
  helperText?: string;
}

/**
 * Stands in for an MUIX time picker or the rich-text editor: a plain field bound to the same
 * form value, with its hint beside it. The real widgets are tested in the shell; here only
 * when they appear, what they hint and what they submit matter.
 */
function StubField({ name, label, helperText }: Readonly<StubFieldProps>) {
  const { register } = useFormContext();
  return (
    <div>
      <input aria-label={label} {...register(name)} />
      <span>{helperText}</span>
    </div>
  );
}

/** Factory for `vi.mock('@exyconn/shell/components/form/rhf', …)`. */
export async function rhfModuleMock(original: () => Promise<object>) {
  return { ...(await original()), RhfTimePicker: StubField, RhfRichText: StubField };
}

/** The policies Legal has published, one of which needs a signature. */
export const POLICIES = [
  { id: 'p1', slug: 'code-of-conduct', title: 'Code of conduct', requiresAcknowledgement: true },
  { id: 'p2', slug: 'privacy', title: 'Privacy notice', requiresAcknowledgement: false },
];

/** The control behind a switch, select or field label. */
export const field = (label: string) => screen.getByLabelText(label);
