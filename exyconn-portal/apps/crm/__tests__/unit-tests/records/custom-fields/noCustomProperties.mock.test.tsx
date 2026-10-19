import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { CustomPropertiesGate } from '../../../../src/records/custom-fields';
import { noCustomPropertiesMock } from '../../../../src/records/custom-fields/noCustomProperties.mock';
import { renderWithProviders } from '../../test-utils';

describe('noCustomPropertiesMock', () => {
  it('answers any record type with no custom properties, so a form renders as before', async () => {
    renderWithProviders(
      <CustomPropertiesGate object={CrmObject.Company}>
        {(custom) => <p>Form with {custom.length} custom</p>}
      </CustomPropertiesGate>,
      { mocks: [noCustomPropertiesMock] },
    );
    expect(await screen.findByText('Form with 0 custom')).toBeInTheDocument();
    expect(noCustomPropertiesMock.request.variables()).toBe(true);
  });
});
