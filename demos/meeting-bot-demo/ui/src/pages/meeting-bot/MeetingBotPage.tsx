import {
  DemoCtaBand,
  DemoFaq,
  DemoFooter,
  DemoHeader,
  DemoHero,
  DemoHighlights,
  DemoSection,
  DemoSteps,
} from '@exyconn/demo-visitor/page';
import { Box } from '@exyconn/shell/components/ui';
import { SendBotPanel } from '../../components/SendBotPanel';
import { TripList } from '../../components/TripList';
import { FAQ, TRY_STEPS, TRY_TIPS } from './content';
import { useMeetingBotDemo } from './useMeetingBotDemo';

/**
 * demos.exyconn.com/meeting-bot-demo: send the Meeting Assistant's notetaker into your own
 * Google Meet call, then read its summary, decisions and action items here and in your inbox.
 */
export function MeetingBotPage() {
  const demo = useMeetingBotDemo();
  return (
    <>
      <DemoHeader current="meeting-bot-demo" />
      <Box component="main" sx={{ minHeight: '100vh' }}>
        <DemoHero
          eyebrow="Live demo · AI meeting notetaker"
          title="Notes, decisions and action items from every call"
          subtitle="Send the notetaker into your own Google Meet call. When the call ends, you get the summary and the action items, with who owns each and by when."
          visual={<SendBotPanel demo={demo} />}
        >
          <DemoHighlights items={TRY_TIPS} />
        </DemoHero>
        <DemoSection
          id="your-calls"
          title="Your calls"
          subtitle="Where the notetaker is, and the notes once the call ends. Only you see these."
          tinted
        >
          <TripList demo={demo} />
        </DemoSection>
        <DemoSection id="how-to-try" title="How to try it">
          <DemoSteps steps={TRY_STEPS} />
        </DemoSection>
        <DemoSection id="faq" title="Questions people ask" tinted>
          <DemoFaq items={FAQ} />
        </DemoSection>
        <DemoCtaBand
          title="Want a notetaker for your team?"
          subtitle="We connect it to your calendar, CRM and project tools, so every meeting ends with its actions already filed."
        />
      </Box>
      <DemoFooter />
    </>
  );
}
