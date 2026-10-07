import { describe, expect, it } from 'vitest';
import * as designSystem from '@exyconn/ui';
import * as designStyles from '@exyconn/ui/styles';
import * as shellUi from '@/components/ui';
import * as shellStyles from '@/components/ui/styles';
import { ImageUploadDialog, ImagePreview } from '@/components/ui/ImageUploadDialog';

describe('the @/components/ui compatibility shims', () => {
  it('hand out the design system itself, not copies', () => {
    expect(shellUi.Button).toBe(designSystem.Button);
    expect(shellUi.createAppTheme).toBe(designSystem.createAppTheme);
    expect(shellStyles.createTheme).toBe(designStyles.createTheme);
    expect(Object.keys(shellStyles).sort((a, b) => a.localeCompare(b))).toEqual(
      Object.keys(designStyles).sort((a, b) => a.localeCompare(b)),
    );
  });

  it('add the shell upload dialog alongside', () => {
    expect(shellUi.ImageUploadDialog).toBe(ImageUploadDialog);
    expect(shellUi.ImagePreview).toBe(ImagePreview);
  });
});
