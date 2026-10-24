import { vi } from 'vitest';

export interface StartBuildProps {
  channelCount: number;
  onDone: () => void;
  onCancel: () => void;
}

/** Every render of the form stand-in, with the props it was given. */
export const startBuildRenders = vi.fn<(props: StartBuildProps) => void>();

/** Stands in for the start-build form, exposing its two ways out. */
export function StartBuildFormStub(props: Readonly<StartBuildProps>) {
  startBuildRenders(props);
  return (
    <div>
      <p>Announced in {props.channelCount} channel(s)</p>
      <button type="button" onClick={props.onDone}>
        Build started
      </button>
      <button type="button" onClick={props.onCancel}>
        Abandon build
      </button>
    </div>
  );
}
