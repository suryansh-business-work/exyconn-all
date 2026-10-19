import type { CreatedRecord } from '../../../src/records/quick-create';

interface PanelProps {
  done: (created: CreatedRecord) => void;
  cancel: () => void;
}

/**
 * Stand-ins for the quick-create side panels (they have their own tests): each saves a fixed
 * new record or cancels, so a form test can check the picker it sits in picks the new record.
 */
function PanelStub({ kind, done, cancel }: Readonly<PanelProps & { kind: string }>) {
  return (
    <div>
      <p>{`New ${kind} panel`}</p>
      <button type="button" onClick={() => done({ id: `new-${kind}`, name: `New ${kind}` })}>
        {`Save new ${kind}`}
      </button>
      <button type="button" onClick={cancel}>
        {`Cancel new ${kind}`}
      </button>
    </div>
  );
}

export function CreateCompanyPanelStub(props: Readonly<PanelProps>) {
  return <PanelStub kind="company" {...props} />;
}

export function CreateContactPanelStub(props: Readonly<PanelProps>) {
  return <PanelStub kind="contact" {...props} />;
}
