import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoogleFontDetails } from '../../../../../../src/pages/website/forms/cms-google-font/GoogleFontDetails';
import {
  googleFontSchema,
  type GoogleFontFormValues,
  type GoogleFontRow,
} from '../../../../../../src/pages/website/forms/cms-google-font/cms-google-font.types';
import { renderWithProviders } from '../../../../test-utils';

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

const inter: GoogleFontRow = {
  family: 'Inter',
  category: 'Sans Serif',
  variants: ['400', '700', '700i'],
  subsets: ['latin'],
  popularity: 1,
};

interface HarnessProps {
  row: GoogleFontRow | null;
  variants: string[];
}

/** The details panel inside a form validated by the Google font schema, with a submit button. */
function Harness({ row, variants }: Readonly<HarnessProps>) {
  const methods = useForm<GoogleFontFormValues>({
    resolver: zodResolver(googleFontSchema),
    defaultValues: { family: row?.family ?? '', variants },
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <GoogleFontDetails row={row} />
        <button type="submit">Check</button>
      </form>
    </FormProvider>
  );
}

const samples = () => screen.queryAllByText(SAMPLE);

describe('GoogleFontDetails', () => {
  it('asks for a family until one is picked', () => {
    renderWithProviders(<Harness row={null} variants={[]} />);

    expect(
      screen.getByText('Pick a family on the left to see it and choose its styles.'),
    ).toBeInTheDocument();
    expect(document.head.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  it('loads the family and previews each chosen style', () => {
    renderWithProviders(<Harness row={inter} variants={['400', '700i']} />);

    expect(screen.getByText('Inter')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Regular 400' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Bold 700' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Bold 700 italic' })).toBeChecked();
    expect(samples()).toHaveLength(2);
    const link = document.head.querySelector('link[rel="stylesheet"]');
    expect(link?.getAttribute('href')).toContain('family=Inter:ital,wght@0,400;0,700;1,700');
  });

  it('adds and removes styles as they are ticked', async () => {
    renderWithProviders(<Harness row={inter} variants={['400']} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('checkbox', { name: 'Bold 700' }));
    expect(screen.getByRole('checkbox', { name: 'Bold 700' })).toBeChecked();
    expect(samples()).toHaveLength(2);

    await user.click(screen.getByRole('checkbox', { name: 'Regular 400' }));
    expect(screen.getByRole('checkbox', { name: 'Regular 400' })).not.toBeChecked();
    expect(samples()).toHaveLength(1);
  });

  it('previews text of your own at the size chosen', async () => {
    renderWithProviders(<Harness row={inter} variants={['400']} />);
    const user = userEvent.setup();

    const text = screen.getByRole('textbox', { name: 'Preview text' });
    expect(text).toHaveValue(SAMPLE);
    await user.clear(text);
    await user.type(text, 'Exyconn');
    expect(screen.getAllByText('Exyconn')).toHaveLength(1);

    const size = screen.getByRole('slider', { name: 'Preview size' });
    expect(size).toHaveValue('32');
    fireEvent.change(size, { target: { value: '48' } });
    expect(size).toHaveValue('48');
  });

  it('says when no style is chosen', async () => {
    renderWithProviders(<Harness row={inter} variants={[]} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Check' }));

    expect(await screen.findByText('Choose at least one style to load')).toBeInTheDocument();
  });
});
