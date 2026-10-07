/**
 * Stand-in modules for the components a panel renders but a panel test does not exercise:
 * forms, dialogs, tab panels and grids. Each records the props it was last rendered with.
 */
/** The props a stand-in form was last rendered with, by form name. */
export const forms: Record<string, Record<string, unknown>> = {};

interface FormStubProps {
  onCancel: () => void;
  onDone: () => void;
  [prop: string]: unknown;
}

/**
 * A form module whose `name` export is a stand-in recording its props, with buttons that run
 * the form's own cancel and done callbacks.
 */
export function formModule(name: string) {
  function FormStub(props: Readonly<FormStubProps>) {
    forms[name] = props;
    return (
      <div data-testid={name}>
        <button type="button" onClick={props.onCancel}>
          stub cancel
        </button>
        <button type="button" onClick={props.onDone}>
          stub done
        </button>
      </div>
    );
  }
  return { [name]: FormStub };
}

interface DialogStubProps {
  onClose: () => void;
  [prop: string]: unknown;
}

/** A dialog module whose `name` export is a stand-in recording its props, with a close button. */
export function dialogModule(name: string) {
  function DialogStub(props: Readonly<DialogStubProps>) {
    forms[name] = props;
    return (
      <div data-testid={name}>
        <button type="button" onClick={props.onClose}>
          stub close
        </button>
      </div>
    );
  }
  return { [name]: DialogStub };
}

/** A module whose `name` export is a prop-less stand-in that prints its own name. */
export function panelModule(name: string) {
  function PanelStub() {
    return <p data-testid={name}>{name}</p>;
  }
  return { [name]: PanelStub };
}

/** A module whose `name` export only records the props it was rendered with. */
export function propsModule(name: string) {
  function PropsStub(props: Readonly<Record<string, unknown>>) {
    forms[name] = props;
    return <div data-testid={name} />;
  }
  return { [name]: PropsStub };
}

/** Reads the props a stand-in last rendered with, failing when it never rendered. */
export function propsOf(name: string): Record<string, unknown> {
  const props = forms[name];
  if (!props) {
    throw new Error(`${name} was not rendered`);
  }
  return props;
}
