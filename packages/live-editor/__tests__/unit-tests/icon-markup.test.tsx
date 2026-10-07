import { describe, expect, it } from 'vitest';
import TitleIcon from '@mui/icons-material/Title';
import { iconMarkup } from '../../src/icon-markup';

describe('iconMarkup', () => {
  it('renders an MUI icon to SVG markup at 28px by default', () => {
    const markup = iconMarkup(TitleIcon);
    expect(markup.startsWith('<svg')).toBe(true);
    expect(markup).toContain('style="width:28px;height:28px"');
  });

  it('renders at the requested size', () => {
    expect(iconMarkup(TitleIcon, 18)).toContain('style="width:18px;height:18px"');
  });
});
