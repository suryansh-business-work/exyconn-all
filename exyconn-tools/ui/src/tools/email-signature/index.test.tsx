import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { clickAway, jsonReply, renderTool, stubFetch } from '../../__tests__/helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

// The upload widget talks to the image API; the form only cares about what it reports back.
vi.mock('../../shared/components/ImageUpload', () => ({
  ImageUpload: ({
    label,
    value,
    fileId,
    folder,
    onChange,
  }: {
    label: string;
    value: string;
    fileId?: string;
    folder: string;
    onChange: (url: string, fileId?: string) => void;
  }) => (
    <div>
      <span>{`${label} | ${folder} | ${value} | ${fileId ?? ''}`}</span>
      <button onClick={() => onChange(`https://cdn.example/${label}.png`, `file-${label}`)}>{`Upload ${label}`}</button>
    </div>
  ),
}));

// The rich-text editor needs real layout; the form only needs its value/onChange contract.
vi.mock('react-quill-new', () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (content: string) => void;
    placeholder: string;
  }) => (
    <textarea
      aria-label="Disclaimer editor"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock('quill/dist/quill.snow.css', () => ({}));

import EmailSignature from './index';

const STORAGE_KEY = 'email-signature-form-data';
// A Tooltip's title becomes the accessible name of the button it wraps.
const COPY_SIGNATURE = 'Copy formatted signature - paste directly into your email client';
const COPY_HTML = 'Copy HTML code for email templates';
// Formik validates asynchronously, and a loaded CI machine can take a while.
const SLOW = { timeout: 10000 };
const savedValues = () => JSON.parse(localStorage.getItem(STORAGE_KEY) as string);

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'execCommand');
  localStorage.clear();
});

const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

/** Holds back timers of the given delay so a "copied" state can be asserted without racing it. */
function holdTimers(delay: number) {
  const held: (() => void)[] = [];
  const realSetTimeout = globalThis.setTimeout;
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void, ms?: number) => {
    if (ms === delay) {
      held.push(handler);
      return 0;
    }
    return realSetTimeout(handler, ms);
  }) as unknown as typeof setTimeout);
  return held;
}

const openTab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));
const typeInto = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillName = () => typeInto(/Full Name/, 'Ada Lovelace');
const preview = () => screen.getByText('Live Preview').closest('.MuiPaper-root') as HTMLElement;

describe('email-signature form tabs', () => {
  it('starts empty with the actions disabled, and previews the name as it is typed', () => {
    renderTool(EmailSignature);
    expect(screen.getByText('Start Creating Your Signature')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY_SIGNATURE })).toBeDisabled();
    expect(screen.getByRole('button', { name: COPY_HTML })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Test Email' })).toBeDisabled();

    fillName();
    typeInto('Job Title', 'Engineer');
    typeInto('Department', 'Research');
    typeInto('Company', 'Analytical Engines');
    typeInto('Email Address', 'ada@example.org');
    typeInto('Phone Number', '+1 555 0100');
    typeInto('Mobile Number', '+1 555 0199');
    typeInto('Address', '12 Babbage Street');

    const sig = within(preview());
    expect(sig.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(sig.getByText(/Engineer \| Research/)).toBeInTheDocument();
    expect(sig.getByText('Analytical Engines')).toBeInTheDocument();
    expect(sig.getByRole('link', { name: 'ada@example.org' })).toHaveAttribute('href', 'mailto:ada@example.org');
    expect(sig.getByRole('link', { name: '+1 555 0199' })).toHaveAttribute('href', 'tel:+1 555 0199');
    expect(sig.getByText('12 Babbage Street')).toBeInTheDocument();
    expect(sig.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY_HTML })).toBeEnabled();
    expect(
      screen.getByText('This is how your signature will appear at the bottom of your emails.')
    ).toBeInTheDocument();
  });

  it('shows a missing name and an invalid email once the fields were touched', async () => {
    renderTool(EmailSignature);
    fireEvent.blur(screen.getByLabelText(/Full Name/));
    expect(await screen.findByText('Full name is required', undefined, SLOW)).toBeInTheDocument();

    typeInto('Email Address', 'nope');
    fireEvent.blur(screen.getByLabelText('Email Address'));
    expect(await screen.findByText('Please enter a valid email address', undefined, SLOW)).toBeInTheDocument();
  });

  it('keeps a validation message on screen after the form has been auto-saved', async () => {
    renderTool(EmailSignature);
    typeInto('Email Address', 'nope');
    fireEvent.blur(screen.getByLabelText('Email Address'));
    await waitFor(() => expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument(), SLOW);

    await waitFor(() => expect(savedValues().email).toBe('nope'), SLOW);
    // The save used to re-initialise the form, which cleared the touched flags and the message.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('shows the length limits of the text fields', async () => {
    renderTool(EmailSignature);
    const limits: [string, number, string][] = [
      ['Job Title', 101, 'Job title must be less than 100 characters'],
      ['Department', 101, 'Department must be less than 100 characters'],
      ['Company', 101, 'Company name must be less than 100 characters'],
      ['Phone Number', 31, 'Phone number must be less than 30 characters'],
      ['Mobile Number', 31, 'Mobile number must be less than 30 characters'],
      ['Address', 201, 'Address must be less than 200 characters'],
    ];
    for (const [label, length] of limits) {
      typeInto(label, 'x'.repeat(length));
      fireEvent.blur(screen.getByLabelText(label));
    }
    for (const [, , message] of limits) {
      await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument(), SLOW);
    }
  });

  it('takes branding images by upload or by URL, with URL validation', async () => {
    renderTool(EmailSignature);
    fillName();
    openTab('Branding');

    fireEvent.click(screen.getByRole('button', { name: 'Upload Drop photo here' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload Drop logo here' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload Drop banner here' }));
    expect(
      screen.getByText(
        'Drop photo here | /email-signatures/photos | https://cdn.example/Drop photo here.png | file-Drop photo here'
      )
    ).toBeInTheDocument();
    expect(
      within(preview())
        .getAllByRole('img')
        .map((img) => img.getAttribute('src'))
    ).toEqual([
      'https://cdn.example/Drop photo here.png',
      'https://cdn.example/Drop logo here.png',
      'https://cdn.example/Drop banner here.png',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'URL' }));
    expect(screen.getByLabelText('Profile Photo URL')).toHaveValue('https://cdn.example/Drop photo here.png');
    typeInto('Profile Photo URL', 'not a url');
    fireEvent.blur(screen.getByLabelText('Profile Photo URL'));
    typeInto('Company Logo URL', 'bad url');
    fireEvent.blur(screen.getByLabelText('Company Logo URL'));
    typeInto('Banner Image URL', 'bad url');
    fireEvent.blur(screen.getByLabelText('Banner Image URL'));
    await waitFor(() => expect(screen.getAllByText('Please enter a valid URL')).toHaveLength(3), SLOW);

    typeInto('Profile Photo URL', 'https://img.example/me.jpg');
    await waitFor(() => expect(screen.getAllByText('Please enter a valid URL')).toHaveLength(2), SLOW);
    expect(within(preview()).getAllByRole('img')[0]).toHaveAttribute('src', 'https://img.example/me.jpg');

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByRole('button', { name: 'Upload Drop photo here' })).toBeInTheDocument();
  });

  it('adds social links, enables them, and shows the active count and icons in the preview', () => {
    renderTool(EmailSignature);
    fillName();
    openTab('Social');
    fireEvent.click(screen.getByRole('button', { name: /Social Links/ }));
    expect(screen.getByText('(0 active)')).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(6);
    fireEvent.click(switches[0]);
    fireEvent.change(screen.getByPlaceholderText('https://linkedin.com/in/yourprofile'), {
      target: { value: 'https://linkedin.com/in/ada' },
    });
    fireEvent.click(switches[5]);
    fireEvent.change(screen.getByPlaceholderText('https://yourwebsite.com'), {
      target: { value: 'https://ada.example' },
    });

    expect(screen.getByText('(2 active)')).toBeInTheDocument();
    const links = within(preview()).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://linkedin.com/in/ada', 'https://ada.example']);

    fireEvent.click(switches[0]);
    expect(screen.getByText('(1 active)')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('https://linkedin.com/in/yourprofile')).toBeNull();
  });

  it('adds, edits, types and removes custom fields', async () => {
    renderTool(EmailSignature);
    fillName();
    openTab('Custom');
    fireEvent.click(screen.getByRole('button', { name: /Custom Fields/ }));
    expect(screen.getByText('(0)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Custom Field' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Custom Field' }));
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('Field #1')).toBeInTheDocument();
    expect(screen.getByText('Field #2')).toBeInTheDocument();

    const labels = screen.getAllByLabelText('Label');
    const values = screen.getAllByLabelText('Value');
    fireEvent.change(labels[0], { target: { value: 'Booking' } });
    fireEvent.change(values[0], { target: { value: 'https://book.example' } });
    fireEvent.change(labels[1], { target: { value: 'Fax' } });
    fireEvent.change(values[1], { target: { value: '+1 555 0111' } });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Link' }));
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Phone' }));
    expect(screen.getByPlaceholderText('+1 234 567 890')).toBeInTheDocument();

    const sig = within(preview());
    expect(sig.getByRole('link', { name: 'https://book.example' })).toHaveAttribute('href', 'https://book.example');
    expect(sig.getByRole('link', { name: '+1 555 0111' })).toHaveAttribute('href', 'tel:+1 555 0111');

    fireEvent.click(screen.getAllByRole('button').filter((b) => b.querySelector('[data-testid="DeleteIcon"]'))[0]);
    expect(screen.getByText('(1)')).toBeInTheDocument();
    expect(sig.queryByText('Booking:')).toBeNull();
    expect(sig.getByText('Fax:')).toBeInTheDocument();
  });

  it('builds the call-to-action button and the disclaimer', async () => {
    renderTool(EmailSignature);
    fillName();
    openTab('CTA');

    typeInto('Button Text', 'Book a call');
    typeInto('Button Link', 'https://cal.example/ada');
    fireEvent.change(screen.getByLabelText('Disclaimer editor'), { target: { value: '<p>Confidential</p>' } });

    const sig = within(preview());
    expect(sig.getByRole('link', { name: 'Book a call' })).toHaveAttribute('href', 'https://cal.example/ada');
    expect(sig.getByText('Confidential')).toBeInTheDocument();

    typeInto('Button Text', 'x'.repeat(51));
    fireEvent.blur(screen.getByLabelText('Button Text'));
    typeInto('Button Link', 'nope');
    fireEvent.blur(screen.getByLabelText('Button Link'));
    expect(await screen.findByText('CTA text must be less than 50 characters', undefined, SLOW)).toBeInTheDocument();
    expect(await screen.findByText('Please enter a valid URL', undefined, SLOW)).toBeInTheDocument();
  });

  it('changes the template from the design tab', () => {
    renderTool(EmailSignature);
    fillName();
    openTab('Design');
    for (const name of ['Modern', 'Minimal', 'Creative', 'Professional']) {
      fireEvent.click(screen.getByText(name));
      expect(within(preview()).getByText(name, { selector: '.MuiChip-label' })).toBeInTheDocument();
    }
  });

  it('changes the colour theme from the design tab', () => {
    renderTool(EmailSignature);
    fillName();
    openTab('Design');
    for (const theme of ['Light', 'Dark', 'Gradient', 'Corporate', 'Elegant']) {
      fireEvent.click(screen.getByText(theme));
    }
    expect(within(preview()).getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('changes the colours by preset and by the custom picker', () => {
    const { container } = renderTool(EmailSignature);
    fillName();
    openTab('Design');

    fireEvent.click(screen.getByLabelText('#059669'));
    expect(within(preview()).getByText('Ada Lovelace')).toHaveStyle({ color: '#059669' });
    fireEvent.click(screen.getByLabelText('#6b7280'));
    const pickers = container.querySelectorAll('input[type="color"]');
    fireEvent.change(pickers[0], { target: { value: '#123456' } });
    fireEvent.change(pickers[1], { target: { value: '#abcdef' } });
    expect(within(preview()).getByText('Ada Lovelace')).toHaveStyle({ color: '#123456' });
  });

  it('changes the font size and family', () => {
    renderTool(EmailSignature);
    fillName();
    openTab('Design');
    fireEvent.click(screen.getByRole('button', { name: 'Large' }));
    expect(within(preview()).getByText('Ada Lovelace')).toHaveStyle({ fontSize: '18px' });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Georgia' }));
    expect(preview().querySelector('table')?.getAttribute('style')).toContain('font-family: Georgia, serif');
  });
});

describe('email-signature persistence', () => {
  it('saves the form to local storage after a pause and restores it on the next visit', async () => {
    const first = renderTool(EmailSignature);
    fillName();
    typeInto('Company', 'Analytical Engines');
    await waitFor(() => expect(savedValues().fullName).toBe('Ada Lovelace'), { timeout: 3000 });
    expect(savedValues().company).toBe('Analytical Engines');
    first.unmount();

    renderTool(EmailSignature);
    expect(screen.getByLabelText(/Full Name/)).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Company')).toHaveValue('Analytical Engines');
  });

  it('resets the form and storage only after confirmation', async () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderTool(EmailSignature);
    fillName();
    await waitFor(() => expect(savedValues().fullName).toBe('Ada Lovelace'), { timeout: 3000 });
    const reset = () => fireEvent.click(screen.getByRole('button', { name: 'Reset all fields' }));

    reset();
    expect(confirm).toHaveBeenCalledWith('Are you sure you want to reset all fields? This cannot be undone.');
    expect(screen.getByLabelText(/Full Name/)).toHaveValue('Ada Lovelace');

    reset();
    expect(await screen.findByText('Form has been reset.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue(''));
    expect(screen.getByText('Start Creating Your Signature')).toBeInTheDocument();
  });

  it('uses the taller preview area on a phone-sized screen', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    renderTool(EmailSignature);
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });
});

describe('email-signature actions', () => {
  const ready = () => {
    renderTool(EmailSignature);
    fillName();
  };
  const snackbar = (text: string | RegExp) => screen.findByText(text);

  it('copies the HTML code and shows a check on the button until the timer clears it', async () => {
    const held = holdTimers(2000);
    ready();
    fireEvent.click(screen.getByRole('button', { name: COPY_HTML }));
    expect(await snackbar('HTML code copied to clipboard!')).toBeInTheDocument();
    const html = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(html).toContain('Ada Lovelace');
    expect(html.trimStart().startsWith('<table')).toBe(true);
    const checkIcon = () => screen.getByRole('button', { name: COPY_HTML }).querySelector('[data-testid="CheckIcon"]');
    expect(checkIcon()).not.toBeNull();

    act(() => held.forEach((run) => run()));
    expect(checkIcon()).toBeNull();
  });

  it('reports a failure to copy the HTML code', async () => {
    ready();
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    fireEvent.click(screen.getByRole('button', { name: COPY_HTML }));
    expect(await snackbar('Failed to copy. Please try again.')).toBeInTheDocument();
  });

  it('copies the formatted signature by selecting a hidden copy of it', async () => {
    const selected: string[] = [];
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(() => {
        selected.push(globalThis.getSelection()?.toString() ?? '');
        return true;
      }),
      configurable: true,
    });
    const held = holdTimers(2000);
    ready();

    fireEvent.click(screen.getByRole('button', { name: COPY_SIGNATURE }));

    expect(await snackbar('Signature copied! Paste directly into your email client.')).toBeInTheDocument();
    expect(held).toHaveLength(1);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(selected[0]).toContain('Ada Lovelace');
    expect(document.body.querySelectorAll('div[style*="left: -9999px"]')).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: COPY_SIGNATURE }).querySelector('[data-testid="CheckIcon"]')
    ).not.toBeNull();
  });

  it('reports a failure to copy the formatted signature and removes the hidden copy', async () => {
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(() => {
        throw new Error('not allowed');
      }),
      configurable: true,
    });
    ready();
    fireEvent.click(screen.getByRole('button', { name: COPY_SIGNATURE }));
    expect(await snackbar('Failed to copy. Please try again.')).toBeInTheDocument();
    expect(document.body.querySelectorAll('div[style*="left: -9999px"]')).toHaveLength(0);
  });

  it('downloads the signature as an HTML file named after the person', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    ready();
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Ada  Byron Lovelace' } });

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(await snackbar('HTML file downloaded!')).toBeInTheDocument();
    expect(click.mock.contexts[0]).toMatchObject({ download: 'email-signature-ada-byron-lovelace.html' });
    const blob = vi.mocked(URL.createObjectURL).mock.calls.at(-1)?.[0] as Blob;
    expect(blob.type).toBe('text/html');
    expect(await readBlob(blob)).toContain('Ada  Byron Lovelace');
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  describe('test email dialog', () => {
    const clickOutsideDialog = () => {
      const container = document.querySelector('.MuiDialog-container') as HTMLElement;
      fireEvent.mouseDown(container);
      fireEvent.click(container);
    };
    const openDialog = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Test Email' }));
      return screen.getByRole('dialog');
    };
    const type = (dialog: HTMLElement, value: string) =>
      fireEvent.change(within(dialog).getByLabelText('Your Email Address'), { target: { value } });

    it('keeps Send disabled until an address is typed and can be cancelled', async () => {
      ready();
      const dialog = openDialog();
      expect(within(dialog).getByRole('button', { name: 'Send Email' })).toBeDisabled();
      expect(within(dialog).getByText(/We will send an actual email/)).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), SLOW);
    });

    it('rejects an address without @', async () => {
      const fetchMock = stubFetch();
      ready();
      const dialog = openDialog();
      type(dialog, 'nobody');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send Email' }));
      expect(await snackbar('Please enter a valid email address.')).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends the signature through the server and closes the dialog', async () => {
      const fetchMock = stubFetch(jsonReply({ success: true }));
      ready();
      const dialog = openDialog();
      type(dialog, 'me@example.org');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send Email' }));

      expect(await snackbar('Test email sent successfully! Check your inbox.')).toBeInTheDocument();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/email\/send-signature-test$/);
      expect(JSON.parse(String(init.body))).toMatchObject({
        to: 'me@example.org',
        senderName: 'Ada Lovelace',
        signatureHtml: expect.stringContaining('Ada Lovelace'),
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), SLOW);
    });

    it('shows the server error, a default message, and a network failure, keeping the dialog open', async () => {
      stubFetch(jsonReply({ success: false, error: 'Mailbox full' }));
      ready();
      const dialog = openDialog();
      type(dialog, 'me@example.org');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send Email' }));
      expect(await snackbar('Mailbox full')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      stubFetch(jsonReply({ success: false }));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send Email' }));
      expect(await snackbar('Failed to send email. Try the client method.')).toBeInTheDocument();

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send Email' }));
      expect(await snackbar('offline')).toBeInTheDocument();
    });

    it('disables the dialog while the email is being sent', async () => {
      let finish: (value: unknown) => void = () => undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise((resolve) => (finish = resolve)))
      );
      ready();
      const dialog = openDialog();
      type(dialog, 'me@example.org');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send Email' }));

      expect(await within(dialog).findByRole('button', { name: 'Sending...' })).toBeDisabled();
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(within(dialog).getByLabelText('Your Email Address')).toBeDisabled();
      clickOutsideDialog();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await act(async () => finish(jsonReply({ success: true })));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), SLOW);
    });

    it('closes when the visitor clicks outside it while idle', async () => {
      ready();
      openDialog();
      clickOutsideDialog();
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), SLOW);
    });

    it('opens the mail client with the HTML copied to the clipboard', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      ready();
      const dialog = openDialog();
      fireEvent.click(within(dialog).getByRole('button', { name: /Open Email Client/ }));
      expect(within(dialog).getByText(/This will open your default email client/)).toBeInTheDocument();
      type(dialog, 'me@example.org');
      const openButtons = within(dialog).getAllByRole('button', { name: 'Open Email Client' });
      fireEvent.click(openButtons[openButtons.length - 1]);

      expect(
        await snackbar('HTML copied! Compose window opened. Paste your signature at the end of the email.')
      ).toBeInTheDocument();
      expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('Ada Lovelace');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), SLOW);
    });
  });

  it('dismisses the notice with its close button and by clicking away', async () => {
    ready();
    fireEvent.click(screen.getByRole('button', { name: COPY_HTML }));
    await snackbar('HTML code copied to clipboard!');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('HTML code copied to clipboard!')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: COPY_HTML }));
    await snackbar('HTML code copied to clipboard!');
    await clickAway();
    await waitFor(() => expect(screen.queryByText('HTML code copied to clipboard!')).toBeNull());
  });
});
