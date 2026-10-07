interface SendFormStubProps {
  onSent: (recipients: number) => void;
}

/** Stands in for the send form inside the page test: reports a send to one or to five people. */
export function SendNotificationFormStub({ onSent }: Readonly<SendFormStubProps>) {
  return (
    <div>
      <button type="button" onClick={() => onSent(1)}>
        Send to one
      </button>
      <button type="button" onClick={() => onSent(5)}>
        Send to five
      </button>
      <button type="button" onClick={() => onSent(0)}>
        Send to nobody
      </button>
    </div>
  );
}
