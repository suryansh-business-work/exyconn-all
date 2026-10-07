import { describe, expect, it } from 'vitest';
import {
  GATE_SEVERITY,
  RATING_COLOR,
  SEVERITY_COLOR,
  SONAR_SETTINGS_PATH,
  metricLabel,
} from '../../../../../src/pages/security/sonar/sonar.types';

describe('sonar.types', () => {
  it('writes a metric key as words', () => {
    expect(metricLabel('new_coverage')).toBe('new coverage');
    expect(metricLabel('new_duplicated_lines_density')).toBe('new duplicated lines density');
    expect(metricLabel('bugs')).toBe('bugs');
  });

  it('colours ratings green to red and severities worst first', () => {
    expect([RATING_COLOR.A, RATING_COLOR.C, RATING_COLOR.E]).toEqual([
      'success',
      'warning',
      'error',
    ]);
    expect([SEVERITY_COLOR.BLOCKER, SEVERITY_COLOR.MINOR, SEVERITY_COLOR.INFO]).toEqual([
      'error',
      'info',
      'default',
    ]);
    expect(GATE_SEVERITY.WARN).toBe('warning');
  });

  it('points at the SonarQube credential under Environment Variables', () => {
    expect(SONAR_SETTINGS_PATH).toBe('/tech/environment-variables/sonarqube');
  });
});
