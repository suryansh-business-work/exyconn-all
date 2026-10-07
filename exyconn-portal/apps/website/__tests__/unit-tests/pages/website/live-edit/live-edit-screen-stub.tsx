import type { ComponentProps } from 'react';
import type { LiveEditScreen } from '../../../../../src/pages/website/live-edit/LiveEditScreen';

type ScreenProps = ComponentProps<typeof LiveEditScreen>;

/** The last props a record page handed the live-edit screen. */
export const liveEditScreen: { props: ScreenProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never opened the screen. */
export function screenProps(): ScreenProps {
  if (!liveEditScreen.props) {
    throw new Error('LiveEditScreen was not rendered');
  }
  return liveEditScreen.props;
}

/** Stands in for the full-screen editor so a record page's own wiring can be read. */
export function LiveEditScreenStub(props: Readonly<ScreenProps>) {
  liveEditScreen.props = props;
  return <h1>{`Editing ${props.title}`}</h1>;
}
