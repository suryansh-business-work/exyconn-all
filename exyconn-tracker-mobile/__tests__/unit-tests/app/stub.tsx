/**
 * A stand-in for a screen a route renders: a marker carrying the props it was given, so a
 * route test checks what the route hands over without rendering the whole screen.
 */
export function stub(name: string) {
  function Stub(props: Readonly<Record<string, unknown>>) {
    return <div data-testid={name} data-props={JSON.stringify(props)} />;
  }
  Stub.displayName = `Stub(${name})`;
  return Stub;
}

/** The props a stub was rendered with. */
export function propsOf(element: HTMLElement): Record<string, unknown> {
  return JSON.parse(element.dataset.props ?? '{}') as Record<string, unknown>;
}
