import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  BRANDING_FIELDS,
  CONSENT_POLICY_FIELDS,
  PROJECT_FIELDS,
  SETTINGS_FIELDS,
  WORKDAY_ONLY_FIELDS,
  WORK_PROFILE_FIELDS,
} from './portal-client';

/**
 * The desktop app hand-writes its GraphQL, so nothing but this test stops a selection from
 * drifting away from the portal's schema. When it does, the portal answers HTTP 400 and the
 * app cannot sign anybody in — which is exactly what a stale `autoSyncEnabled` field did.
 *
 * The portal lives in the same repository, so its type definitions are read directly rather
 * than mirrored here: a copy would drift the same way the query did.
 */
const PORTAL_SRC = fileURLToPath(new URL('../../../exyconn-portal/server/src', import.meta.url));

const TRACKER_TYPEDEFS = `${PORTAL_SRC}/modules/tracker/tracker.typeDefs.ts`;

const SOURCES: Readonly<Record<string, string>> = {
  TrackerSettings: TRACKER_TYPEDEFS,
  TrackerWorkProfile: TRACKER_TYPEDEFS,
  TrackerWorkday: TRACKER_TYPEDEFS,
  TrackerProject: TRACKER_TYPEDEFS,
  TrackerConsentPolicy: TRACKER_TYPEDEFS,
  Branding: `${PORTAL_SRC}/modules/branding/branding.typeDefs.ts`,
};

/** The field names declared on one GraphQL object type in a typeDefs file. */
function schemaFieldsOf(typeName: string): Set<string> {
  const source = readFileSync(SOURCES[typeName], 'utf8');
  const block = new RegExp(String.raw`\n  type ${typeName} \{\n([\s\S]*?)\n  \}`).exec(source);
  expect(block, `no "type ${typeName}" block in the portal schema`).not.toBeNull();

  const fields = new Set<string>();
  for (const line of (block?.[1] ?? '').split('\n')) {
    const field = /^\s{4}(\w+)\s*(\([^)]*\))?\s*:/.exec(line);
    if (field !== null) {
      fields.add(field[1]);
    }
  }
  return fields;
}

/** The field names a flat selection set asks for. */
function selectedFields(selection: string): string[] {
  return selection.split(/\s+/).filter((name) => name !== '');
}

describe.each([
  { typeName: 'TrackerSettings', selection: SETTINGS_FIELDS },
  { typeName: 'TrackerWorkProfile', selection: WORK_PROFILE_FIELDS },
  { typeName: 'TrackerWorkday', selection: WORKDAY_ONLY_FIELDS },
  { typeName: 'TrackerProject', selection: PROJECT_FIELDS },
  { typeName: 'TrackerConsentPolicy', selection: CONSENT_POLICY_FIELDS },
  { typeName: 'Branding', selection: BRANDING_FIELDS },
])('$typeName selection', ({ typeName, selection }) => {
  it('asks the portal only for fields the portal actually has', () => {
    const schemaFields = schemaFieldsOf(typeName);
    const unknown = selectedFields(selection).filter((name) => !schemaFields.has(name));
    expect(unknown).toEqual([]);
  });

  it('reads at least one field, so an empty selection cannot pass silently', () => {
    expect(selectedFields(selection).length).toBeGreaterThan(0);
  });
});
