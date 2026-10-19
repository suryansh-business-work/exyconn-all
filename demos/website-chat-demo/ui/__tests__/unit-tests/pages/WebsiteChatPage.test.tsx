import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebsiteChatPage } from '../../../src/pages/website-chat';
import { FEATURES } from '../../../src/pages/website-chat/features';
import { site, workflow } from '../fixtures';
import { renderWithProviders } from '../test-utils';

const demo = vi.hoisted(() => ({
  value: null as unknown,
  pickSite: vi.fn(),
  tryWorkflow: vi.fn(),
}));
vi.mock('../../../src/pages/website-chat/useWebsiteDemo', () => ({
  LIVE_CHAT_ID: 'live-chat',
  useWebsiteDemo: () => demo.value,
}));
vi.mock('../../../src/pages/website-chat/LiveChat', () => ({ LiveChat: () => <p>Live chat</p> }));

const ADVISORY = site('advisory', { website: 'http://northwind.example' }, [
  workflow('quote', 'Get a quote'),
]);
const STORE = site('store', {}, [workflow('order', 'Place an order'), workflow('track', 'Track')]);

function serve(sites: ReturnType<typeof site>[], current = sites[0]) {
  demo.value = {
    sites,
    current,
    chat: {},
    loading: false,
    error: undefined,
    retry: vi.fn(),
    pickSite: demo.pickSite,
    tryWorkflow: demo.tryWorkflow,
  };
}

describe('the website chat demo page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the live chat, the site picker and the site as it sits on a website', () => {
    serve([ADVISORY, STORE]);
    renderWithProviders(<WebsiteChatPage />);
    expect(screen.getByText('Live chat')).toBeInTheDocument();
    expect(screen.getByLabelText('Pick a website')).toBeInTheDocument();
    expect(screen.getByText('northwind.example')).toBeInTheDocument();
    expect(screen.getByText('3 ready-made workflows')).toBeInTheDocument();
    expect(screen.getByText('Works on')).toBeInTheDocument();
    expect(screen.getByText(FEATURES[0].title)).toBeInTheDocument();
  });

  it('tries a workflow of the site on screen without switching sites', async () => {
    serve([ADVISORY, STORE]);
    renderWithProviders(<WebsiteChatPage />);
    await userEvent.click(screen.getByLabelText('Try Get a quote'));
    expect(demo.pickSite).not.toHaveBeenCalled();
    expect(demo.tryWorkflow).toHaveBeenCalledWith('quote');
  });

  it("switches to another site before trying one of its workflows", async () => {
    serve([ADVISORY, STORE]);
    renderWithProviders(<WebsiteChatPage />);
    await userEvent.click(screen.getByLabelText('Try Place an order'));
    expect(demo.pickSite).toHaveBeenCalledWith('store');
    expect(demo.tryWorkflow).toHaveBeenCalledWith('order');
  });

  it('starts a workflow from the mock site', async () => {
    serve([ADVISORY]);
    renderWithProviders(<WebsiteChatPage />);
    await userEvent.click(screen.getByText('Chat with us'));
    expect(demo.tryWorkflow).toHaveBeenCalledWith('quote');
  });

  it('leaves out the picker and the mock site while no site is published', () => {
    serve([], undefined);
    renderWithProviders(<WebsiteChatPage />);
    expect(screen.queryByLabelText('Pick a website')).not.toBeInTheDocument();
    expect(screen.queryByText('This is how it sits on a website')).not.toBeInTheDocument();
    expect(screen.getByText('0 ready-made workflows')).toBeInTheDocument();
  });
});
