import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { FontPreview } from '../../../../../../src/pages/website/forms/cms-design-system/FontPreview';
import { renderWithProviders } from '../../../../test-utils';

const HEADING = 'AI that does the work';
const BODY =
  'Body text reads in the sans role. The quick brown fox jumps over the lazy dog, 0123456789.';
const CODE = 'const answer = 42;';

describe('FontPreview', () => {
  it('draws headings in the display role, body in sans and code in mono', () => {
    renderWithProviders(
      <FontPreview
        roles={[
          { key: 'sans', value: 'Inter, sans-serif' },
          { key: 'display', value: 'Anton, sans-serif' },
          { key: 'mono', value: 'Menlo, monospace' },
        ]}
      />,
    );

    expect(screen.getByText(HEADING)).toHaveStyle({ fontFamily: 'Anton, sans-serif' });
    expect(screen.getByText('A second-level heading')).toHaveStyle({
      fontFamily: 'Anton, sans-serif',
    });
    expect(screen.getByText(BODY)).toHaveStyle({ fontFamily: 'Inter, sans-serif' });
    expect(screen.getByText(CODE)).toHaveStyle({ fontFamily: 'Menlo, monospace' });
  });

  it('falls back to generic families, headings following the body', () => {
    renderWithProviders(<FontPreview roles={[{ key: 'sans', value: '' }]} />);

    expect(screen.getByText(HEADING)).toHaveStyle({ fontFamily: 'sans-serif' });
    expect(screen.getByText(BODY)).toHaveStyle({ fontFamily: 'sans-serif' });
    expect(screen.getByText(CODE)).toHaveStyle({ fontFamily: 'monospace' });
  });

  it('uses the body family for headings when no display role is set', () => {
    renderWithProviders(<FontPreview roles={[{ key: 'sans', value: 'Lora, serif' }]} />);

    expect(screen.getByText(HEADING)).toHaveStyle({ fontFamily: 'Lora, serif' });
  });
});
