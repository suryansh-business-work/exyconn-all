import { describe, expect, it, vi } from 'vitest';
import { DEVICES, addDeviceButtons } from '../../src/devices';
import { headlessEditor } from './test-utils';

const buttons = () => {
  const editor = headlessEditor({ deviceManager: { devices: DEVICES } });
  addDeviceButtons(editor);
  const setDevice = vi.spyOn(editor, 'setDevice');
  const button = (id: string) => {
    const found = editor.Panels.getButton('options', `device-${id}`);
    if (!found) {
      throw new Error(`No ${id} button`);
    }
    return found;
  };
  const press = (id: string) => (button(id).get('command') as (ed: unknown) => void)(editor);
  return { editor, setDevice, button, press };
};

describe('addDeviceButtons', () => {
  it('adds a titled, non-toggling button per device with Desktop active', () => {
    const { button } = buttons();
    expect(DEVICES.map((device) => button(device.id ?? '').get('attributes'))).toEqual([
      { title: 'Desktop preview' },
      { title: 'Tablet preview' },
      { title: 'Mobile preview' },
    ]);
    expect(button('desktop').get('active')).toBe(true);
    expect(button('tablet').get('active')).toBe(false);
    expect(button('mobile').get('togglable')).toBe(false);
    expect(button('mobile').get('label')).toContain('width:18px;height:18px');
  });

  it('switches the canvas to the pressed device', () => {
    const { setDevice, press, editor } = buttons();
    press('tablet');
    expect(setDevice).toHaveBeenLastCalledWith('Tablet');
    expect(editor.getDevice()).toBe('Tablet');
    press('desktop');
    expect(editor.getDevice()).toBe('Desktop');
  });
});
