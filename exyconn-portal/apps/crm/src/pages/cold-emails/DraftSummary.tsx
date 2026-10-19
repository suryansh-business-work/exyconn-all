import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Link } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import {
  CrmTimelineObject,
  type ColdEmailDraftFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { DetailField, DetailList } from '../../records/detail';
import { COLD_EMAILS_PATH, recordPath, useToneLabel } from '../../records/cold-email';

/** Who the draft is for, what it offers and how it is written, with a way back to the record. */
export function DraftSummary({ draft }: Readonly<{ draft: ColdEmailDraftFieldsFragment }>) {
  const t = useT();
  const toneLabel = useToneLabel();
  const { formatDateTime } = useFormatters();
  const object = draft.object === CrmTimelineObject.Contact ? 'CONTACT' : 'COMPANY';
  return (
    <Box sx={panel}>
      <DetailList>
        <DetailField label="Record">
          <Link component={RouterLink} to={recordPath(object, draft.recordId)}>
            {draft.recordName}
          </Link>
        </DetailField>
        <DetailField label="To">{draft.toEmail}</DetailField>
        <DetailField label="What we are offering" empty="An introduction to your company">
          {draft.goal}
        </DetailField>
        <DetailField label="Tone">{toneLabel(draft.tone)}</DetailField>
        <DetailField label="Drafted">
          {t('{when} by {name}', {
            when: formatDateTime(draft.createdAt),
            name: draft.createdByName,
          })}
        </DetailField>
      </DetailList>
      <Link component={RouterLink} to={COLD_EMAILS_PATH} variant="body2">
        {t('All cold emails')}
      </Link>
    </Box>
  );
}
