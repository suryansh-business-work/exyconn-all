import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSignaturePad, SignaturePad, SIGNATURE_HEIGHT } from '@/components/signature';
import { renderWithProviders } from '../../test-utils';
import { FormHarness, formValues } from '../form/formHarness';
import { DRAWN, FakeSignaturePad, TYPED, fakeContext, stubCanvas } from './signaturePadMock';

vi.mock('signature_pad', async () => ({
  default: (await import('./signaturePadMock')).FakeSignaturePad,
}));

const PAD_LABEL = 'Signature pad: draw your signature with a mouse, finger or stylus';

function renderPad(props: Partial<Parameters<typeof SignaturePad>[0]> = {}) {
  const onChange = vi.fn<(dataUrl: string) => void>();
  const view = renderWithProviders(
    <SignaturePad label="Your signature" onChange={onChange} {...props} />,
  );
  onChange.mockClear();
  return { onChange, ...view };
}

const typeMode = () => userEvent.click(screen.getByRole('button', { name: 'Type' }));
const typedField = () => screen.getByRole('textbox', { name: 'Type your name as your signature' });

beforeEach(() => {
  FakeSignaturePad.instances.length = 0;
  stubCanvas();
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SignaturePad — drawing', () => {
  it('opens on a drawing pad in dark ink, sized to its box at the screen’s pixel ratio', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const context = stubCanvas();
    renderPad();

    const canvas = screen.getByRole('img', { name: PAD_LABEL });
    const pad = FakeSignaturePad.latest();
    expect(pad.canvas).toBe(canvas);
    expect(pad.options).toEqual({ penColor: expect.any(String) });
    expect(canvas).toMatchObject({ width: 600, height: SIGNATURE_HEIGHT * 2 });
    expect(context?.scale).toHaveBeenCalledWith(2, 2);
    expect(pad.clear).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Draw' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('never draws below one pixel per point, and copes without a 2D context', () => {
    vi.stubGlobal('devicePixelRatio', 0);
    stubCanvas(null);
    renderPad();

    expect(screen.getByRole('img', { name: PAD_LABEL })).toMatchObject({
      width: 300,
      height: SIGNATURE_HEIGHT,
    });
  });

  it('hands over the drawing as a PNG after every stroke', () => {
    const { onChange } = renderPad();

    act(() => FakeSignaturePad.latest().endStroke());

    expect(onChange).toHaveBeenLastCalledWith(DRAWN);
  });

  it('hands over nothing when a stroke leaves the pad empty', () => {
    const { onChange } = renderPad();
    const pad = FakeSignaturePad.latest();
    pad.empty = true;

    act(() => pad.endStroke());

    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('clears the value when the window resizes, since resizing wipes the canvas', () => {
    const { onChange } = renderPad();
    const pad = FakeSignaturePad.latest();
    pad.clear.mockClear();

    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });

    expect(pad.clear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('wipes the pad and the value on Clear', async () => {
    const { onChange } = renderPad();
    const pad = FakeSignaturePad.latest();
    act(() => pad.endStroke());
    pad.clear.mockClear();

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(pad.clear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('lets go of the pad and the window when it goes away', () => {
    const { unmount } = renderPad();
    const pad = FakeSignaturePad.latest();
    const removed = vi.spyOn(globalThis, 'removeEventListener');

    unmount();

    expect(pad.listeners.has('endStroke')).toBe(false);
    expect(pad.off).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

describe('SignaturePad — typing', () => {
  it('renders a typed name as the signature', async () => {
    const context = fakeContext();
    stubCanvas(context);
    const { onChange } = renderPad();
    await typeMode();

    expect(screen.queryByRole('img', { name: PAD_LABEL })).not.toBeInTheDocument();
    fireEvent.change(typedField(), { target: { value: 'Asha Rao' } });

    expect(typedField()).toHaveValue('Asha Rao');
    expect(context.fillText).toHaveBeenLastCalledWith(
      'Asha Rao',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    expect(onChange).toHaveBeenLastCalledWith(TYPED);
  });

  it('gives no signature for a name of only spaces', async () => {
    const { onChange } = renderPad();
    await typeMode();

    fireEvent.change(typedField(), { target: { value: '   ' } });

    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('caps the typed name at 80 characters', async () => {
    renderPad();
    await typeMode();
    expect(typedField()).toHaveAttribute('maxlength', '80');
  });

  it('empties the typed name on Clear', async () => {
    const { onChange } = renderPad();
    await typeMode();
    fireEvent.change(typedField(), { target: { value: 'Asha Rao' } });

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(typedField()).toHaveValue('');
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('starts over when switching between drawing and typing', async () => {
    const { onChange } = renderPad();
    await typeMode();
    expect(onChange).toHaveBeenLastCalledWith('');
    fireEvent.change(typedField(), { target: { value: 'Asha Rao' } });

    await userEvent.click(screen.getByRole('button', { name: 'Draw' }));

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('img', { name: PAD_LABEL })).toBeInTheDocument();
    await typeMode();
    expect(typedField()).toHaveValue('');
  });

  it('stays put when the chosen mode is pressed again', async () => {
    const { onChange } = renderPad();
    await userEvent.click(screen.getByRole('button', { name: 'Draw' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Draw' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SignaturePad — label and messages', () => {
  it('shows the label without a star, and the hint, when optional', () => {
    renderPad({ helperText: 'Sign inside the box' });
    expect(screen.getByText('Your signature')).toHaveTextContent(/^Your signature$/);
    expect(screen.getByText('Sign inside the box')).toBeInTheDocument();
  });

  it('marks a required signature with a star hidden from screen readers', () => {
    renderPad({ required: true });
    const star = screen.getByText('*');
    expect(star).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(/^Your signature/)).toHaveTextContent('Your signature *');
  });

  it('shows the error in place of the hint, on the field being drawn or typed', async () => {
    renderPad({ helperText: 'Sign inside the box', error: 'Sign here' });
    expect(screen.getByText('Sign here')).toHaveClass('Mui-error');
    expect(screen.queryByText('Sign inside the box')).not.toBeInTheDocument();

    await typeMode();
    expect(typedField()).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an empty message line when there is neither hint nor error', () => {
    const { container } = renderPad();
    const helper = container.querySelector('.MuiFormHelperText-root');
    expect(helper).toBeEmptyDOMElement();
    expect(helper).not.toHaveClass('Mui-error');
  });
});

describe('RhfSignaturePad', () => {
  const schema = z.object({ signature: z.string().min(1, 'Draw or type your signature') });

  it('writes the signature into the form', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ signature: '' }}>
        <RhfSignaturePad name="signature" label="Your signature" />
      </FormHarness>,
    );

    act(() => FakeSignaturePad.latest().endStroke());

    expect(formValues().signature).toBe(DRAWN);
  });

  it('shows the form’s validation message until somebody signs', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <FormHarness
        defaultValues={{ signature: '' }}
        resolver={zodResolver(schema)}
        onSubmit={onSubmit}
      >
        <RhfSignaturePad name="signature" label="Your signature" helperText="Sign below" />
      </FormHarness>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Draw or type your signature')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => FakeSignaturePad.latest().endStroke());
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Sign below')).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith({ signature: DRAWN }, expect.anything());
  });
});
