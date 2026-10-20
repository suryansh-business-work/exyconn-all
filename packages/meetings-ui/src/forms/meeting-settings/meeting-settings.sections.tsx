import { useT } from '@exyconn/i18n';
import {
  RhfChipsInput,
  RhfMultiSelect,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { FormSection } from '@exyconn/shell/components/form/FormSection';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { MaLanguage, MaReleaseChannel, MaSummaryStyle } from '@exyconn/shell/graphql/generated';
import { LIMITS, REMINDER_INTERVALS } from './meeting-settings.schema';

/** Enum options with their words translated. */
function useEnumOptions() {
  const t = useT();
  return (values: string[]): SelectOption[] =>
    enumOptions(values).map((option) => ({ ...option, label: t(option.label) }));
}

/** Who may use the assistant, and how it reminds them. */
export function AccessSection({ people }: Readonly<{ people: SelectOption[] }>) {
  const t = useT();
  const intervals = REMINDER_INTERVALS.map((minutes) => ({
    value: String(minutes),
    label: t('Every {minutes} min', { minutes }),
  }));
  return (
    <FormSection title="Access and reminders">
      <RhfSwitch name="enabled" label="Meeting Assistant is on for the company" />
      <RhfMultiSelect
        name="allowedUserIds"
        label="Who may use it"
        options={people}
        helperText="Leave empty to allow everyone"
      />
      <RhfSwitch name="remindersEnabled" label="Remind people to start recording" />
      <RhfSelect name="reminderIntervalMinutes" label="Reminder interval" options={intervals} />
      <RhfTextField
        name="maxRemindersPerMeeting"
        label="Most reminders per meeting"
        type="number"
        slotProps={{ htmlInput: LIMITS.reminders }}
      />
    </FormSection>
  );
}

/** What the AI writes, and in what language. */
export function NotesSection() {
  const options = useEnumOptions();
  return (
    <FormSection title="Transcripts and notes">
      <RhfSelect
        name="preferredLanguage"
        label="Preferred language"
        options={options(Object.values(MaLanguage))}
      />
      <RhfSelect
        name="summaryStyle"
        label="Summary style"
        options={options(Object.values(MaSummaryStyle))}
      />
      <RhfSwitch name="autoGenerateSummary" label="Write the notes when a call ends" />
      <RhfSwitch name="diarization" label="Tell speakers apart" />
      <RhfSwitch name="liveTranscript" label="Show the transcript live during the call" />
      <RhfSwitch name="participantTracking" label="Track who joins and leaves" />
      <RhfTextField
        name="transcriptRetentionDays"
        label="Keep transcripts for (days)"
        type="number"
        slotProps={{ htmlInput: LIMITS.retentionDays }}
      />
      <RhfSwitch name="saveRecordings" label="Save the call audio (WAV)" />
      <RhfTextField
        name="audioRetentionDays"
        label="Keep recordings for (days)"
        type="number"
        helperText="0 keeps them until the meeting is deleted"
        slotProps={{ htmlInput: LIMITS.audioRetentionDays }}
      />
      <RhfTextField name="analysisModel" label="Analysis model" />
      <RhfTextField name="transcriptionModel" label="Transcription model" />
    </FormSection>
  );
}

/** Who gets the summary email, and whether somebody approves it first. */
export function EmailSection() {
  return (
    <FormSection title="Summary email">
      <RhfSwitch name="autoEmail" label="Email the summary automatically" />
      <RhfSwitch name="emailRequiresApproval" label="The meeting owner approves each email first" />
      <RhfSwitch name="emailParticipants" label="Email the participants with verified addresses" />
      <RhfChipsInput
        name="defaultRecipients"
        label="Always send to"
        helperText="Type an email address and press Enter"
      />
      <RhfChipsInput
        name="emailAllowedDomains"
        label="Only send to these domains"
        helperText="Type a domain like example.com and press Enter; empty allows any"
      />
    </FormSection>
  );
}

/** What the assistant may cost, how long a call may run, and which builds people get. */
export function LimitsSection() {
  const options = useEnumOptions();
  return (
    <FormSection title="Limits and releases">
      <RhfTextField
        name="monthlyBudgetUsd"
        label="Monthly AI budget (USD)"
        type="number"
        slotProps={{ htmlInput: { min: 0 } }}
      />
      <RhfTextField
        name="maxMeetingMinutes"
        label="Longest call recorded (minutes)"
        type="number"
        slotProps={{ htmlInput: LIMITS.meetingMinutes }}
      />
      <RhfSelect
        name="releaseChannel"
        label="Extension release channel"
        options={options(Object.values(MaReleaseChannel))}
      />
    </FormSection>
  );
}
