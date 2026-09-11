import type { DeviceProperties, Editor } from 'grapesjs';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { iconMarkup } from './icon-markup';

/** Widths the article is previewed at; styles set on the smaller two apply at those breakpoints. */
export const DEVICES: DeviceProperties[] = [
  { id: 'desktop', name: 'Desktop', width: '' },
  { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
  { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
];

const DEVICE_ICONS = {
  desktop: DesktopWindowsIcon,
  tablet: TabletMacIcon,
  mobile: PhoneIphoneIcon,
} as const;

/** Adds a Desktop / Tablet / Mobile switcher to the canvas toolbar. */
export function addDeviceButtons(editor: Editor): void {
  for (const device of DEVICES) {
    const id = device.id as keyof typeof DEVICE_ICONS;
    editor.Panels.addButton('options', {
      id: `device-${id}`,
      label: iconMarkup(DEVICE_ICONS[id], 18),
      togglable: false,
      active: id === 'desktop',
      attributes: { title: `${device.name} preview` },
      command: () => editor.setDevice(device.name ?? ''),
    });
  }
}
