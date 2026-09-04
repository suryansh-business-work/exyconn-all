import { useFormContext } from 'react-hook-form';
import { Box, FormHelperText } from '@exyconn/shell/components/ui';
import { RhfRichText, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { useMyPoliciesQuery } from '@exyconn/shell/graphql/generated';

/** Chosen when no Legal policy is used; the rich-text disclosure below applies instead. */
const NO_POLICY = '';

/**
 * What the desktop app shows before tracking can start.
 *
 * Two ways to say it, and the choice matters. A Legal policy is the better one: acceptance is
 * recorded in Legal's versioned signature ledger, so HR, Legal and the tracker all read one
 * record, and re-publishing changed wording asks every employee again instead of quietly
 * carrying an old agreement forward. The rich-text box stays for workspaces that have not
 * written the policy up yet.
 */
export function ConsentDisclosureFields() {
  const { watch } = useFormContext<{ consentPolicySlug: string }>();
  const { data } = useMyPoliciesQuery();
  const usingPolicy = watch('consentPolicySlug') !== NO_POLICY;

  const options = [
    { value: NO_POLICY, label: 'No policy — use the text below' },
    ...(data?.myPolicies ?? []).map((policy) => ({
      value: policy.slug,
      label: policy.requiresAcknowledgement ? `${policy.title} (signed)` : policy.title,
    })),
  ];

  return (
    <>
      <Box>
        <RhfSelect
          name="consentPolicySlug"
          label="Tracking disclosure policy (Legal)"
          options={options}
        />
        <FormHelperText>
          A policy that requires acknowledgement is signed in the desktop app, and the signature
          appears in Legal alongside every other. Publish a new version to ask everybody again.
        </FormHelperText>
      </Box>
      {!usingPolicy && (
        <RhfRichText
          name="consentText"
          label="Consent disclosure (shown in the desktop app)"
          helperText="The employee must read and accept this before any tracking starts."
        />
      )}
    </>
  );
}
