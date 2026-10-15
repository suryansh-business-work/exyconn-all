import { LIMITS } from '@exyconn/wa-flow';
import { CountedField } from './CountedField';

/** Header, body and footer — shared by Buttons, List and Call to action messages. */
export function MessageFrameFields() {
  return (
    <>
      <CountedField name="header" label="Header" max={LIMITS.header} />
      <CountedField name="text" label="Message" max={LIMITS.text} multiline />
      <CountedField name="footer" label="Footer" max={LIMITS.footer} />
    </>
  );
}
