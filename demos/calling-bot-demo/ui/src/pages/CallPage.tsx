import { useI18n } from '@exyconn/i18n';
import {
  DEMO_PHOTOS,
  DemoFaq,
  DemoHero,
  DemoHighlights,
  DemoPhotoFrame,
  DemoSection,
  DemoSteps,
} from '@exyconn/demo-visitor/page';
import { Box, Typography } from '@exyconn/shell/components/ui';
import { useCallingBotAvailabilityQuery } from '@exyconn/shell/graphql/generated';
import { PhoneCallPanel } from '../components/PhoneCallPanel';
import { CallHeroVisual } from './CallHeroVisual';
import {
  CALL_FAQ,
  CALL_STEPS,
  CALL_TIPS,
  PHONE_CALL_TIPS,
  SETTINGS_FAQ,
  USE_CASES,
} from './call-page.content';

/**
 * The FAQ, with the language and length questions answered from the live settings — so they
 * are asked only once both are known.
 */
function faqFor(
  languageCode: string | null | undefined,
  maxCallSeconds: number | null | undefined,
  locale: string,
) {
  if (!languageCode || !maxCallSeconds) {
    return { items: CALL_FAQ, values: undefined };
  }
  return {
    items: [...SETTINGS_FAQ, ...CALL_FAQ],
    values: {
      language: languageName(languageCode, locale),
      minutes: Math.round(maxCallSeconds / 60),
    },
  };
}

/** The demo's language, named in the visitor's own language ("hi-IN" -> "Hindi"). */
function languageName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Two columns that stack on a phone. */
const TWO_COLUMNS = {
  display: 'grid',
  gap: { xs: 3, md: 6 },
  alignItems: 'center',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
} as const;

/**
 * demos.exyconn.com/calling-bot-demo: talk to the AI calling bot on a drawn phone in the
 * browser, or have it ring your own phone when the install has a Vobiz number; then how to try
 * it, what businesses use it for, and what people ask.
 */
export function CallPage() {
  const { t, locale } = useI18n();
  const { data, loading } = useCallingBotAvailabilityQuery({ fetchPolicy: 'cache-and-network' });
  const availability = data?.callingBotAvailability;
  const available = Boolean(availability?.available);
  // Sections alternate with the hero's panel colour; the phone section, when shown, shifts them.
  const phoneEnabled = Boolean(availability?.phoneEnabled);
  const { items: faq, values: faqValues } = faqFor(
    availability?.languageCode,
    availability?.maxCallSeconds,
    locale,
  );

  return (
    <Box component="main" sx={{ minHeight: '100vh' }}>
      <DemoHero
        eyebrow="Live demo · AI voice agent"
        title="Talk to our AI calling bot"
        subtitle="It listens, thinks and answers in real time. Interrupt it whenever you like — it stops and listens, like a person would."
        visual={<CallHeroVisual loading={loading && !availability} available={available} />}
      >
        <Typography variant="subtitle2" component="h2">
          {t('Before you call')}
        </Typography>
        <DemoHighlights items={CALL_TIPS} />
      </DemoHero>
      {phoneEnabled && (
        <DemoSection
          id="phone-call"
          title="Or take the call on your phone"
          subtitle="Enter your number and the bot rings you, just like it would ring your customers."
        >
          <Box sx={TWO_COLUMNS}>
            <PhoneCallPanel />
            <DemoHighlights items={PHONE_CALL_TIPS} />
          </Box>
        </DemoSection>
      )}
      <DemoSection id="how-to-try" title="How to try it" tinted={phoneEnabled}>
        <DemoSteps steps={CALL_STEPS} />
      </DemoSection>
      <DemoSection id="use-cases" title="What businesses use it for" tinted={!phoneEnabled}>
        <Box sx={TWO_COLUMNS}>
          <DemoHighlights items={USE_CASES} />
          <DemoPhotoFrame photo={DEMO_PHOTOS.caller} />
        </Box>
      </DemoSection>
      <DemoSection id="faq" title="Questions people ask" tinted={phoneEnabled}>
        <DemoFaq items={faq} values={faqValues} />
      </DemoSection>
    </Box>
  );
}
