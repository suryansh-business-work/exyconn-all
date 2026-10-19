import { useT } from '@exyconn/i18n';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Flex,
  Grid,
  Text,
} from '@exyconn/shell/components/ui';
import {
  RhfCurrencyField,
  RhfDatePicker,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { CAMPAIGN_TYPE_OPTIONS, type CampaignRow } from '../campaign.types';
import type { StudioOptions } from '../studio/useStudioOptions';

interface SetupStepProps {
  options: StudioOptions;
  campaign: CampaignRow | null;
}

/** Who the email is from, what it is about, and how it shows in the inbox. */
export function SetupStep({ options, campaign }: Readonly<SetupStepProps>) {
  const t = useT();
  const senderOptions = options.verifiedSenders.map((email) => ({ value: email, label: email }));
  const categoryOptions = [
    { value: '', label: t('General marketing (no category)') },
    ...options.categories.map((category) => ({ value: category.id, label: category.name })),
  ];
  return (
    <Flex direction="column" spacing={2}>
      <RhfTextField
        name="name"
        label="Internal campaign name"
        required
        helperText="Only your team sees this, e.g. “October café offer — Delhi”."
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfSelect
            name="campaignType"
            label="Campaign type"
            options={CAMPAIGN_TYPE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
            helperText="Used in reports, and to suggest a preference category."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfSelect
            name="preferenceCategoryId"
            label="Marketing preference category"
            options={categoryOptions}
            helperText="Recipients who turned this category off will not get the email."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfTextField
            name="senderName"
            label="Sender name"
            required
            helperText="The name shown in the inbox, e.g. “Exyconn Team”."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfSelect
            name="senderEmail"
            label="Verified sender email"
            options={senderOptions}
            helperText="Only addresses verified for your mail service can be used."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfTextField
            name="replyTo"
            label="Reply-to email"
            type="email"
            helperText="Optional. Where replies go, if not the sender address."
          />
        </Grid>
      </Grid>
      {senderOptions.length === 0 && (
        <Alert severity="error">
          {t('No email configuration is active. Add one in Tech > Email before sending campaigns.')}
        </Alert>
      )}
      <RhfTextField
        name="subject"
        label="Email subject"
        required
        helperText="Keep it under about 60 characters so inboxes show all of it."
      />
      <RhfTextField
        name="preheader"
        label="Preview text"
        helperText="The grey line shown after the subject in most inboxes. Under 150 characters works best."
      />
      <Accordion disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Text size="sm" weight="medium">
            {t('Advanced settings')}
          </Text>
        </AccordionSummary>
        <AccordionDetails>
          <Flex direction="column" spacing={2}>
            <RhfCurrencyField
              name="budget"
              label="Budget"
              helperText="Optional, for reporting what the campaign cost."
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfDatePicker
                  name="startDate"
                  label="Campaign starts"
                  helperText="Optional reporting period."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfDatePicker name="endDate" label="Campaign ends" />
              </Grid>
            </Grid>
            <RhfSwitch name="trackClicks" label="Track link clicks" />
            <RhfSwitch name="trackOpens" label="Estimate opens with a tracking image" />
            {campaign?.templateKey && (
              <Text size="caption" color="text.secondary">
                {t('Started from the Tech > Email template “{key}”.', {
                  key: campaign.templateKey,
                })}
              </Text>
            )}
          </Flex>
        </AccordionDetails>
      </Accordion>
    </Flex>
  );
}
