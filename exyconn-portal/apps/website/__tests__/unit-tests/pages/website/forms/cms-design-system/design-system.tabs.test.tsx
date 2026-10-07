import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { designTabs } from '../../../../../../src/pages/website/forms/cms-design-system/design-system.tabs';
import { renderWithProviders } from '../../../../test-utils';
import type { DesignSystemFormValues } from '../../../../../../src/pages/website/forms/cms-design-system';
import { DesignHarness } from './design-harness';

describe('designTabs', () => {
  it('has a tab per token group, then fonts and extra CSS', () => {
    const tabs = designTabs('site-1');

    expect(tabs.map((tab) => [tab.slug, tab.label])).toEqual([
      ['palette', 'Palette'],
      ['light', 'Colours (light)'],
      ['dark', 'Colours (dark)'],
      ['fonts', 'Fonts'],
      ['radii', 'Radii'],
      ['shadows', 'Shadows'],
      ['spacing', 'Spacing'],
      ['css', 'Extra CSS'],
    ]);
  });

  it('hands the fonts tab the site its uploads belong to', () => {
    const fonts = designTabs('site-7').find((tab) => tab.slug === 'fonts')?.content;

    expect(isValidElement<{ siteId: string }>(fonts) && fonts.props.siteId).toBe('site-7');
  });

  it('edits the extra CSS as code', () => {
    const css = designTabs('site-1').find((tab) => tab.slug === 'css')?.content;
    renderWithProviders(
      <DesignHarness values={{ extraCss: '.btn { color: red; }' }}>{css}</DesignHarness>,
    );

    const field = screen.getByRole('textbox', { name: 'Extra CSS' });
    expect(field).toHaveValue('.btn { color: red; }');
    expect(field).toHaveAttribute('spellcheck', 'false');
    expect(
      screen.getByText('Written after the tokens on every page: utility classes, font-face rules.'),
    ).toBeInTheDocument();
  });

  it.each([
    ['light', 'colorsLight', '--color-primary'],
    ['dark', 'colorsDark', '--color-primary'],
    ['shadows', 'shadows', '--shadow-primary'],
    ['spacing', 'spacing', '--space-primary'],
  ] as const)('the %s tab edits the %s tokens', (slug, group, property) => {
    const content = designTabs('site-1').find((tab) => tab.slug === slug)?.content;
    const values: Partial<DesignSystemFormValues> = {};
    values[group] = [{ key: 'primary', value: '#155dfc' }];
    renderWithProviders(<DesignHarness values={values}>{content}</DesignHarness>);

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('primary');
    expect(screen.getByText(property)).toBeInTheDocument();
  });
});
