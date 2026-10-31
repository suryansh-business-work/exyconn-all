import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { DETAILS, signupPlan } from './signup.fixtures';

const request = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRequestSignupCodeMutation: () => [request],
}));

const { SignupForm } = await import('../../../src/Signup/forms/signup');

const PLANS = [signupPlan(), signupPlan({ id: 'plan-free', name: 'Free', trialDays: 0 })];

function mount(plans = PLANS) {
  const onCodeSent = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<SignupForm plans={plans} accentColor="#1a237e" onCodeSent={onCodeSent} />);
  return { user, onCodeSent };
}

const box = (name: RegExp) => screen.getByRole('textbox', { name });

async function fill(user: ReturnType<typeof userEvent.setup>, country = true) {
  await user.type(box(/Your name/), DETAILS.name);
  await user.type(box(/Work email/), DETAILS.email);
  await user.type(box(/Company name/), DETAILS.companyName);
  await user.type(screen.getByRole('combobox', { name: /Currency/ }), 'GBP');
  await user.click(await screen.findByRole('option', { name: /^GBP/ }));
  if (country) {
    await user.type(screen.getByRole('combobox', { name: /Country/ }), 'United Kingdom');
    await user.click(await screen.findByRole('option', { name: 'United Kingdom' }));
  }
}

const send = () => screen.getByRole('button', { name: 'Email me a code' });

describe('SignupForm', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('names each plan with its free trial, and picks the first', async () => {
    const { user } = mount();
    const picker = screen.getByRole('combobox', { name: /^Plan/ });
    expect(picker).toHaveTextContent('Growth — 14-day free trial');

    await user.click(picker);
    expect(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Free' }),
    ).toBeInTheDocument();
  });

  it('asks for every required field before sending a code', async () => {
    const { user } = mount();
    await user.click(send());

    expect(await screen.findByText('Your name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Company name is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it('refuses an address that is not an email and a one-letter company', async () => {
    const { user } = mount();
    await user.type(box(/Work email/), 'ada@');
    await user.type(box(/Company name/), 'N');
    await user.click(send());

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Company name is required')).toBeInTheDocument();
  });

  it('needs a plan when none is offered', async () => {
    const { user } = mount([]);
    await fill(user, false);
    await user.click(send());
    expect(await screen.findByText('Pick a plan')).toBeInTheDocument();
  });

  it('emails the code and hands the details to the next step', async () => {
    request.mockResolvedValue({ data: { requestSignupCode: true } });
    const { user, onCodeSent } = mount();
    await fill(user);
    await user.click(send());

    await vi.waitFor(() => expect(onCodeSent).toHaveBeenCalledWith(DETAILS));
    expect(request).toHaveBeenCalledWith({ variables: { email: DETAILS.email } });
  });

  it('sends without a country, which is optional', async () => {
    request.mockResolvedValue({ data: { requestSignupCode: true } });
    const { user, onCodeSent } = mount();
    await fill(user, false);
    await user.click(send());

    await vi.waitFor(() => expect(onCodeSent).toHaveBeenCalledWith({ ...DETAILS, country: '' }));
  });

  it('says why the code was not sent and stays on the step', async () => {
    request.mockImplementation(async () => {
      throw new Error('This email already has an account. Sign in instead.');
    });
    const { user, onCodeSent } = mount();
    await fill(user, false);
    await user.click(send());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This email already has an account. Sign in instead.',
    );
    expect(onCodeSent).not.toHaveBeenCalled();
  });

  it('falls back to a general message for a failure with no message', async () => {
    request.mockImplementation(async () => {
      throw 'nope';
    });
    const { user } = mount();
    await fill(user, false);
    await user.click(send());
    expect(await screen.findByRole('alert')).toHaveTextContent('The code could not be sent');
  });
});
