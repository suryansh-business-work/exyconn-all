import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@/components/form/zodResolver';
import { RhfFreeSoloField } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'whisper-1'];

const field = () => screen.getByRole('combobox', { name: /^Model\s*\*?$/ });
const optionNames = () =>
  within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent);

describe('RhfFreeSoloField', () => {
  it('shows the stored value, its hint, and is addressable by name', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ model: 'whisper-1' }}>
        <RhfFreeSoloField
          name="model"
          label="Model"
          options={MODELS}
          helperText="The model that writes the notes"
        />
      </FormHarness>,
    );

    expect(field()).toHaveValue('whisper-1');
    expect(field()).toHaveAttribute('name', 'model');
    expect(screen.getByText('The model that writes the notes')).toBeInTheDocument();
  });

  it('starts empty when the form holds no value yet', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfFreeSoloField name="model" label="Model" options={MODELS} />
      </FormHarness>,
    );

    expect(field()).toHaveValue('');
  });

  it('offers every suggestion before anything is typed, and stores the one picked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ model: '' }}>
        <RhfFreeSoloField name="model" label="Model" options={MODELS} />
      </FormHarness>,
    );

    await user.click(field());
    await user.keyboard('{ArrowDown}');
    expect(optionNames()).toEqual(MODELS);

    await user.click(screen.getByRole('option', { name: 'gpt-4o-mini' }));
    expect(formValues().model).toBe('gpt-4o-mini');
  });

  it('filters by what is typed, keeps the typed text, and offers it when it is new', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ model: '' }}>
        <RhfFreeSoloField name="model" label="Model" options={MODELS} />
      </FormHarness>,
    );

    await user.type(field(), 'GPT');
    expect(optionNames()).toEqual(['gpt-4o', 'gpt-4o-mini', 'Use "GPT"']);
    expect(formValues().model).toBe('GPT');

    await user.clear(field());
    await user.type(field(), 'ft:gpt-4o:acme::x1 ');
    expect(optionNames()).toEqual(['Use "ft:gpt-4o:acme::x1"']);
    expect(formValues().model).toBe('ft:gpt-4o:acme::x1 ');
  });

  it('does not offer a typed name that is already a suggestion, whatever its case', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ model: '' }}>
        <RhfFreeSoloField name="model" label="Model" options={MODELS} />
      </FormHarness>,
    );

    await user.type(field(), 'GPT-4O');
    expect(optionNames()).toEqual(['gpt-4o', 'gpt-4o-mini']);
  });

  it('stores an empty string once the text is deleted', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ model: 'gpt-4o' }}>
        <RhfFreeSoloField name="model" label="Model" options={MODELS} />
      </FormHarness>,
    );

    await user.clear(field());
    expect(formValues().model).toBe('');
    expect(field()).toHaveValue('');
  });

  it('says it is loading while the suggestions arrive', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ model: '' }}>
        <RhfFreeSoloField name="model" label="Model" options={[]} loading />
      </FormHarness>,
    );

    await user.click(field());
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
  });

  it('explains why the suggestions failed, and still lets a name be typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ model: '' }}>
        <RhfFreeSoloField
          name="model"
          label="Model"
          options={[]}
          helperText="Pick a model"
          optionsError="The provider did not answer."
        />
      </FormHarness>,
    );

    expect(
      screen.getByText('The provider did not answer. You can still type a name.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Pick a model')).toBeNull();
    await user.type(field(), 'gpt-5');
    expect(formValues().model).toBe('gpt-5');
  });

  it("stars a required field from the schema and shows the schema's error over the hint", async () => {
    const user = userEvent.setup();
    const schema = z.object({ model: z.string().min(1, 'Name a model') });
    renderWithProviders(
      <FormHarness defaultValues={{ model: '' }} resolver={zodResolver(schema)}>
        <RhfFreeSoloField name="model" label="Model" options={MODELS} helperText="Pick a model" />
      </FormHarness>,
    );

    expect(field()).toBeRequired();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Name a model')).toBeInTheDocument();
    expect(screen.queryByText('Pick a model')).toBeNull();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });
});
