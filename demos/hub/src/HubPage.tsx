import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useT } from '@exyconn/i18n';
import {
  DEMO_PHOTOS,
  DemoCtaBand,
  DemoFaq,
  DemoFeatures,
  DemoFooter,
  DemoHeader,
  DemoHero,
  DemoHighlights,
  DemoPhotoFrame,
  DemoSection,
  DemoSteps,
} from '@exyconn/demo-visitor/page';
import { Box, Button, Grid } from '@exyconn/shell/components/ui';
import { DemoCard } from './DemoCard';
import { DEMOS } from './demos';
import { HUB_FAQ, HUB_STEPS } from './hub.content';
import { HUB_FEATURES } from './hub.features';

/** Why a prospect can trust what they are about to try. */
const HERO_FACTS = [
  'Live AI, not a recording',
  'Sign in with a one-time code, nothing to install',
  'Works on a laptop or a phone',
];

/** demos.exyconn.com: every live demo, what each shows, how to try it, and what people ask. */
export function HubPage() {
  const t = useT();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DemoHeader />
      <Box component="main" sx={{ flex: 1 }}>
        <DemoHero
          eyebrow="Live AI demos"
          title="See our AI agents at work before you decide"
          subtitle="Talk to a voice bot that answers like a person and chat with WhatsApp automations built for real businesses. Each demo runs on the same platform our clients use."
          visual={<DemoPhotoFrame photo={DEMO_PHOTOS.team} eager />}
        >
          <DemoHighlights items={HERO_FACTS} />
          <Box>
            <Button variant="contained" size="large" href="#demos" endIcon={<ArrowDownwardIcon />}>
              {t('Browse the demos')}
            </Button>
          </Box>
        </DemoHero>
        <DemoSection
          id="demos"
          title="Pick a demo"
          subtitle="Both are live. Try one, or both with the same sign-in."
        >
          <Grid container spacing={3} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {DEMOS.map((demo) => (
              <Grid key={demo.key} size={{ xs: 12, md: 6 }} component="li">
                <DemoCard demo={demo} />
              </Grid>
            ))}
          </Grid>
        </DemoSection>
        <DemoSection id="how-it-works" title="How to try a demo" tinted>
          <DemoSteps steps={HUB_STEPS} />
        </DemoSection>
        <DemoSection
          id="why"
          title="Built for real business conversations"
          subtitle="The same agents you try here answer our clients' customers every day."
        >
          <DemoFeatures items={HUB_FEATURES} />
        </DemoSection>
        <DemoSection id="faq" title="Questions people ask" tinted>
          <DemoFaq items={HUB_FAQ} />
        </DemoSection>
        <DemoCtaBand
          title="Want this working for your business?"
          subtitle="Tell us what your customers call and message about. We tailor the flows, voice, language and integrations, and run them for you."
        />
      </Box>
      <DemoFooter />
    </Box>
  );
}
