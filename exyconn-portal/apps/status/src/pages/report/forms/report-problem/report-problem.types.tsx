import type { ProblemCategory, ProblemSeverity } from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

/** Exactly what the public form collects; everything else is set by the server. */
export interface ReportProblemValues {
  serviceKey: string;
  category: ProblemCategory;
  severity: ProblemSeverity;
  subject: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  pageUrl: string;
}

/** What the caller hands the form and gets back from it. */
export interface ReportProblemFormProps {
  /** Services the reporter may pick, built from the live status overview. */
  services: SelectOption[];
  /** Receives the reference the server issued, so the page can show the receipt. */
  onSubmitted: (reference: string) => void;
  onCancel: () => void;
}
