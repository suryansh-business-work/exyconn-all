import { useImperativeHandle } from 'react';
import type { LiveDesign, LiveEditorProps } from '@exyconn/live-editor';

/** What the stand-in editor hands back, and whether it attaches its handle at all. */
export const liveEditor: {
  props: LiveEditorProps | null;
  design: LiveDesign;
  attached: boolean;
} = {
  props: null,
  design: { html: '<p>Edited</p>', css: 'p{color:red}' },
  attached: true,
};

/** Reads the recorded props, failing the test when the screen never mounted the editor. */
export function editorProps(): LiveEditorProps {
  if (!liveEditor.props) {
    throw new Error('LiveEditor was not rendered');
  }
  return liveEditor.props;
}

/**
 * Stands in for the GrapesJS editor (it needs a real browser): records its props, exposes
 * `getDesign` through the ref like the real one, and offers buttons for the two things a
 * user's work makes it report — a change, and a failed upload.
 */
export function LiveEditorStub(props: Readonly<LiveEditorProps>) {
  liveEditor.props = props;
  useImperativeHandle(liveEditor.attached ? props.ref : undefined, () => ({
    getDesign: () => liveEditor.design,
    getProjectData: () => ({}),
  }));
  return (
    <div>
      <button type="button" onClick={props.onDirty}>
        Change the design
      </button>
      <button type="button" onClick={() => props.onError('Upload failed: too large')}>
        Fail an upload
      </button>
    </div>
  );
}
