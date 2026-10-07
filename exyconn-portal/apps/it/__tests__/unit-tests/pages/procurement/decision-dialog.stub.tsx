import { ItDecision } from '@exyconn/shell/graphql/generated';
import type { DecisionValues } from '../../../../src/components/decision';

export interface DecisionDialogStubProps {
  title: string | null;
  onDecide: (values: DecisionValues) => Promise<unknown>;
  onClose: () => void;
  onDecided: () => void;
}

/** The last props the page gave the decision dialog, and the last decision it sent. */
export const decisionDialog: {
  props: DecisionDialogStubProps | null;
  lastDecision: Promise<unknown> | null;
} = { props: null, lastDecision: null };

/**
 * Stands in for the IT decision drawer (it has its own tests): closed while there is no
 * title, otherwise the title and one button per callback the page handed it.
 */
export function DecisionDialogStub(props: Readonly<DecisionDialogStubProps>) {
  decisionDialog.props = props;
  if (props.title === null) {
    return null;
  }
  return (
    <section aria-label="decision">
      <p>{`Deciding ${props.title}`}</p>
      <button
        type="button"
        onClick={() => {
          decisionDialog.lastDecision = props.onDecide({
            decision: ItDecision.Rejected,
            note: 'Too expensive',
          });
        }}
      >
        Reject it
      </button>
      <button type="button" onClick={props.onDecided}>
        Decision recorded
      </button>
      <button type="button" onClick={props.onClose}>
        Close decision
      </button>
    </section>
  );
}
