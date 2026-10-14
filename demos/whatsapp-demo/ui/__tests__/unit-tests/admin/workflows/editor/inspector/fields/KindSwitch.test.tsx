import { screen } from '@testing-library/react';
import { KindSwitch } from '../../../../../../../src/admin/workflows/editor/inspector/fields/KindSwitch';
import { pickOption, renderField, submitted } from '../node-form-helpers';

const KINDS = { url: 'Open a link', call: 'Call a number' };

describe('KindSwitch', () => {
  it('replaces the whole item with a starter of the picked kind', async () => {
    const starter = vi.fn((kind: string, current: Record<string, unknown>) => ({
      kind,
      title: current.title,
      phone: '',
    }));
    const { user, onSubmit, submit } = renderField(
      <KindSwitch name="actions.0" label="Action" kinds={KINDS} starter={starter} />,
      { actions: [{ kind: 'url', title: 'Visit', url: 'https://x.example' }] },
    );
    expect(screen.getByRole('combobox', { name: 'Action' })).toHaveTextContent('Open a link');
    await pickOption(user, 'Action', 'Call a number');
    expect(starter).toHaveBeenCalledWith('call', {
      kind: 'url',
      title: 'Visit',
      url: 'https://x.example',
    });
    expect(screen.getByRole('combobox', { name: 'Action' })).toHaveTextContent('Call a number');
    await submit();
    expect((await submitted(onSubmit)).actions).toEqual([
      { kind: 'call', title: 'Visit', phone: '' },
    ]);
  });

  it('builds the starter from nothing when the item does not exist yet', async () => {
    const starter = vi.fn((kind: string) => ({ kind }));
    const { user } = renderField(
      <KindSwitch
        name="section"
        label="Section type"
        kinds={{ text: 'Paragraph' }}
        starter={starter}
      />,
      {},
      { messages: { Paragraph: 'Absatz' } },
    );
    await pickOption(user, 'Section type', 'Absatz');
    expect(starter).toHaveBeenCalledWith('text', {});
  });
});
