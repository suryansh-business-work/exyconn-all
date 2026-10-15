import { useT } from '@exyconn/i18n';
import {
  DemoCtaBand,
  DemoFaq,
  DemoFeatures,
  DemoFooter,
  DemoHeader,
  DemoHero,
  DemoHighlights,
  DemoSection,
  DemoSteps,
} from '@exyconn/demo-visitor/page';
import { Box } from '@exyconn/shell/components/ui';
import { BrowserFrame } from '../../components/BrowserFrame';
import { EmbedSnippet } from '../../components/EmbedSnippet';
import { MockSite } from '../../components/MockSite';
import { SitePicker } from '../../components/SitePicker';
import { WorkflowGallery } from '../../components/WorkflowGallery';
import { WIDGET_PLATFORMS } from '@exyconn/bot-studio/widget';
import { FAQ, INSTALL_STEPS, SNIPPET_EXAMPLE, TRY_STEPS, TRY_TIPS } from './content';
import { FEATURES } from './features';
import { LiveChat } from './LiveChat';
import { useWebsiteDemo } from './useWebsiteDemo';

const TWO_COLUMNS = {
  display: 'grid',
  gap: { xs: 3, md: 6 },
  alignItems: 'start',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
} as const;

/**
 * demos.exyconn.com/website-chat-demo: chat with the AI agent of a sample services firm or
 * online store, see it on the business's own website, start any of its workflows, and see how
 * it goes onto a client's site with one line.
 */
export function WebsiteChatPage() {
  const t = useT();
  const demo = useWebsiteDemo();
  const { sites, current } = demo;
  const workflowCount = sites.reduce((sum, site) => sum + site.workflows.length, 0);
  const tryFrom = (demoKey: string, workflowKey: string) => {
    if (demoKey !== current?.demo.key) {
      demo.pickSite(demoKey);
    }
    demo.tryWorkflow(workflowKey);
  };

  return (
    <>
      <DemoHeader current="website-chat-demo" />
      <Box component="main" sx={{ minHeight: '100vh' }}>
        <DemoHero
          eyebrow="Live demo · AI website chat agent"
          title="An AI agent that sells, books and supports on your website"
          subtitle="It answers every visitor in seconds, captures the lead, books the meeting, takes the order and hands hard questions to your team. Try it as a customer would."
          visual={<LiveChat demo={demo} />}
        >
          {current && (
            <SitePicker sites={sites} current={current.demo.key} onPick={demo.pickSite} />
          )}
          <DemoHighlights items={TRY_TIPS} />
        </DemoHero>
        {current && (
          <DemoSection
            id="on-your-site"
            title="This is how it sits on a website"
            subtitle="The demo business's own site. Every tile and the Chat with us button start that conversation in the agent above."
          >
            <BrowserFrame address={current.demo.business.website.replace(/^https?:\/\//, '')}>
              <MockSite site={current} onAsk={demo.tryWorkflow} />
            </BrowserFrame>
          </DemoSection>
        )}
        <DemoSection
          id="workflows"
          title={t('{count} ready-made workflows', { count: workflowCount })}
          subtitle="Each one carries a whole task through: from the first question to the estimate, booking, order or ticket. Press Try it to run it in the chat."
          tinted
        >
          <WorkflowGallery sites={sites} onTry={tryFrom} />
        </DemoSection>
        <DemoSection
          id="install"
          title="On your website with one line"
          subtitle="No rebuild and no developer time: paste the snippet, or install it from your CMS."
        >
          <Box sx={TWO_COLUMNS}>
            <EmbedSnippet snippet={SNIPPET_EXAMPLE} platforms={WIDGET_PLATFORMS} />
            <DemoSteps steps={INSTALL_STEPS} />
          </Box>
        </DemoSection>
        <DemoSection id="features" title="What it does for your business" tinted>
          <DemoFeatures items={FEATURES} />
        </DemoSection>
        <DemoSection id="how-to-try" title="How to try it">
          <DemoSteps steps={TRY_STEPS} />
        </DemoSection>
        <DemoSection id="faq" title="Questions people ask" tinted>
          <DemoFaq items={FAQ} />
        </DemoSection>
        <DemoCtaBand
          title="Want an AI agent on your website?"
          subtitle="We build it around your services, products and policies, connect it to your CRM, calendar and helpdesk, and have it live in weeks."
        />
      </Box>
      <DemoFooter />
    </>
  );
}
