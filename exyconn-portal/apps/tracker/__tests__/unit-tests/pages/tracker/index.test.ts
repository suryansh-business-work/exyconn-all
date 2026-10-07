import { describe, expect, it } from 'vitest';
import * as trackerPages from '../../../../src/pages/tracker';
import { TrackerPage } from '../../../../src/pages/tracker/TrackerPage';
import { TrackerAccessPage } from '../../../../src/pages/tracker/TrackerAccessPage';
import { TrackerDevicesPage } from '../../../../src/pages/tracker/TrackerDevicesPage';
import { TrackerSettingsPage } from '../../../../src/pages/tracker/TrackerSettingsPage';
import { TrackerBillingPage } from '../../../../src/pages/tracker/TrackerBillingPage';
import { TrackerApprovalsPage } from '../../../../src/pages/tracker/TrackerApprovalsPage';
import { TrackerMessagesPage } from '../../../../src/pages/tracker/TrackerMessagesPage';

describe('tracker pages entry point', () => {
  it('exposes exactly the seven screens the router mounts', () => {
    expect({ ...trackerPages }).toEqual({
      TrackerPage,
      TrackerAccessPage,
      TrackerDevicesPage,
      TrackerSettingsPage,
      TrackerBillingPage,
      TrackerApprovalsPage,
      TrackerMessagesPage,
    });
  });
});
