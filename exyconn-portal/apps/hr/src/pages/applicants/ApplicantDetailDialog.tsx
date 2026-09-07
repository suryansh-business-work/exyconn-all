import { Box, Divider, Link, Stack, Text, Typography } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { ratingStars, type PagedApplicantRow } from './applicants-grid';

interface ApplicantDetailDialogProps {
  applicant: PagedApplicantRow | null;
  onClose: () => void;
}

/** A resume reference is a link when the form gave us one, and plain text when it is a file name. */
function ResumeLine({ resumeUrl }: Readonly<{ resumeUrl: string }>) {
  if (!resumeUrl) {
    return <Text size="sm">No resume attached</Text>;
  }
  if (resumeUrl.startsWith('http')) {
    return (
      <Link href={resumeUrl} target="_blank" rel="noopener" underline="hover">
        {resumeUrl}
      </Link>
    );
  }
  return <Text size="sm">{resumeUrl}</Text>;
}

/** One applicant in full: who they are, what they wrote, and every move so far. */
export function ApplicantDetailDialog({
  applicant,
  onClose,
}: Readonly<ApplicantDetailDialogProps>) {
  const { formatDate } = useSettings();

  if (!applicant) {
    return null;
  }

  const contact = [applicant.email, applicant.phone].filter(Boolean).join(' · ');

  return (
    <CrudDialog open title={applicant.name} onClose={onClose}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <StatusChip value={applicant.stage} />
          <StatusChip value={applicant.source} />
          <Text size="sm" color="text.secondary">
            {ratingStars(applicant.rating)} · applied {formatDate(applicant.createdAt)}
          </Text>
        </Stack>

        <Box>
          <Typography variant="subtitle2">{applicant.jobTitle || 'No job title'}</Typography>
          <Text size="sm" color="text.secondary">
            {[applicant.jobCode, applicant.companySlug].filter(Boolean).join(' · ')}
          </Text>
          <Text size="sm">{contact}</Text>
        </Box>

        <Box>
          <Typography variant="subtitle2">Resume</Typography>
          <ResumeLine resumeUrl={applicant.resumeUrl} />
        </Box>

        <Box>
          <Typography variant="subtitle2">Cover letter</Typography>
          <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
            {applicant.coverLetter || 'No cover letter'}
          </Text>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2">Notes &amp; history</Typography>
          <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
            {applicant.notes || 'Nothing recorded yet'}
          </Text>
        </Box>
      </Stack>
    </CrudDialog>
  );
}
