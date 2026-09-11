import { useParams } from 'react-router-dom';
import { useGetCaseStudyQuery, useUpdateCaseStudyMutation } from '@exyconn/shell/graphql/generated';
import type { LiveDesign } from '@exyconn/live-editor';
import { LiveEditScreen } from './LiveEditScreen';
import { RecordState } from './RecordState';
import { MEDIA_FOLDERS, siteUrl } from './live-edit.config';

/** Live-edits a case study's body at /website/case-studies/:id/live-edit. */
export function CaseStudyLiveEditPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useGetCaseStudyQuery({
    variables: { id },
    skip: id === '',
    fetchPolicy: 'network-only',
  });
  const [updateCaseStudy] = useUpdateCaseStudyMutation();
  const study = data?.getCaseStudy;

  if (!study) {
    return <RecordState loading={loading} error={error} label="case study" />;
  }

  // Only the body changes; the required identity fields ride along unchanged.
  const save = (design: LiveDesign) =>
    updateCaseStudy({
      variables: {
        id: study.id,
        input: {
          slug: study.slug,
          title: study.title,
          content: design.html,
          contentCss: design.css,
        },
      },
    });

  return (
    <LiveEditScreen
      key={study.id}
      title={study.title}
      pageUrl={siteUrl(`/case-studies/${study.slug}`)}
      backPath="/website/case-studies"
      folder={MEDIA_FOLDERS.caseStudies}
      initial={{ html: study.content, css: study.contentCss }}
      onSave={save}
    />
  );
}
