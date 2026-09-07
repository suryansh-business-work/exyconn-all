import { Chip, Flex } from '@exyconn/shell/components/ui';
import { useWebsiteFormTypesQuery } from '@exyconn/shell/graphql/generated';

interface SubmissionFormTypeFilterProps {
  /** The form type the inbox is scoped to, or '' for every form. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Scopes the inbox to one form.
 *
 * The list comes from `websiteFormTypes` rather than a constant here, so the portal offers
 * exactly the forms the server accepts — the same list the Astro site's submit route reads,
 * and the reason there is no longer a hand-copied second copy of it in either place.
 */
export function SubmissionFormTypeFilter({
  value,
  onChange,
}: Readonly<SubmissionFormTypeFilterProps>) {
  const { data } = useWebsiteFormTypesQuery();
  const formTypes = data?.websiteFormTypes ?? [];

  return (
    <Flex direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
      <Chip
        label="All forms"
        color={value === '' ? 'primary' : 'default'}
        variant={value === '' ? 'filled' : 'outlined'}
        onClick={() => onChange('')}
      />
      {formTypes.map((formType) => (
        <Chip
          key={formType}
          label={formType}
          color={value === formType ? 'primary' : 'default'}
          variant={value === formType ? 'filled' : 'outlined'}
          onClick={() => onChange(value === formType ? '' : formType)}
        />
      ))}
    </Flex>
  );
}
