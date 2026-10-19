import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StudioStepContent,
  type StudioStepContentProps,
} from '../../../../../../../src/pages/marketing/forms/campaign/studio/StudioStepContent';
import { campaignRow } from '../../../../../fixtures';
import { CONTACT, checksState, previewState, studioOptions } from '../studio.fixtures';

/** Each step becomes its name and the props it was given, so only the routing is tested. */
vi.mock('../../../../../../../src/pages/marketing/forms/campaign/steps/SetupStep', () => ({
  SetupStep: (props: object) => <output aria-label="SetupStep">{Object.keys(props).join()}</output>,
}));
vi.mock('../../../../../../../src/pages/marketing/forms/campaign/steps/AudienceStep', () => ({
  AudienceStep: (props: object) => (
    <output aria-label="AudienceStep">{Object.keys(props).join()}</output>
  ),
}));
vi.mock('../../../../../../../src/pages/marketing/forms/campaign/steps/DesignStep', () => ({
  DesignStep: (props: object) => (
    <output aria-label="DesignStep">{Object.keys(props).join()}</output>
  ),
}));
vi.mock('../../../../../../../src/pages/marketing/forms/campaign/steps/PersonalizeStep', () => ({
  PersonalizeStep: (props: object) => (
    <output aria-label="PersonalizeStep">{Object.keys(props).join()}</output>
  ),
}));
vi.mock('../../../../../../../src/pages/marketing/forms/campaign/steps/TestStep', () => ({
  TestStep: (props: { campaignId: string | null }) => (
    <output aria-label="TestStep">{`${Object.keys(props).join()} id=${props.campaignId}`}</output>
  ),
}));
vi.mock('../../../../../../../src/pages/marketing/forms/campaign/steps/ReviewStep', () => ({
  ReviewStep: (props: object) => (
    <output aria-label="ReviewStep">{Object.keys(props).join()}</output>
  ),
}));

const props = (overrides: Partial<StudioStepContentProps> = {}): StudioStepContentProps => ({
  step: 'setup',
  campaign: campaignRow(),
  options: studioOptions(),
  preview: previewState(),
  previewRecord: CONTACT,
  onPreviewRecord: vi.fn(),
  checks: checksState(),
  save: vi.fn(),
  onQueued: vi.fn(),
  ...overrides,
});

describe('StudioStepContent', () => {
  it.each([
    ['setup', 'SetupStep', 'options,campaign'],
    ['audience', 'AudienceStep', ''],
    ['design', 'DesignStep', 'options,preview'],
    ['personalize', 'PersonalizeStep', 'options,preview,previewRecord,onPreviewRecord'],
    ['test', 'TestStep', 'campaignId,preview,previewRecord,checks,save id=campaign-1'],
    ['review', 'ReviewStep', 'campaign,options,checks,save,onQueued'],
  ] as const)('shows the %s step with only what it needs', (step, name, given) => {
    render(<StudioStepContent {...props({ step })} />);
    expect(screen.getByRole('status', { name })).toHaveTextContent(given);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('tests an unsaved campaign with no id', () => {
    render(<StudioStepContent {...props({ step: 'test', campaign: null })} />);
    expect(screen.getByRole('status', { name: 'TestStep' })).toHaveTextContent('id=null');
  });
});
