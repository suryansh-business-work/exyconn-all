import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ISSUE_COLUMNS } from '../../../../../src/pages/security/sonar/sonar-issue-columns';
import { HOST, issue } from '../../../../../src/pages/security/sonar/SonarPage.fixtures';
import type { SonarIssueRow } from '../../../../../src/pages/security/sonar/sonar.types';
import { createWrapper } from '../../../test-utils';

const row = (fields: Partial<SonarIssueRow> = {}): SonarIssueRow => ({
  ...issue('I1', 'MAJOR', 'Extract this nested ternary'),
  id: 'I1',
  ...fields,
});

function cell(key: string, issueRow: SonarIssueRow) {
  const column = ISSUE_COLUMNS.find((col) => col.key === key);
  if (!column?.render) {
    throw new Error(`No rendered column ${key}`);
  }
  return render(<>{column.render(issueRow)}</>, { wrapper: createWrapper() });
}

describe('ISSUE_COLUMNS', () => {
  it('lists severity, type, issue, place and link', () => {
    expect(ISSUE_COLUMNS.map((col) => col.label)).toEqual([
      'Severity',
      'Type',
      'Issue',
      'Where',
      'Open',
    ]);
  });

  it('shows the severity as a chip, known or not', () => {
    cell('severity', row());
    expect(screen.getByText('MAJOR')).toBeInTheDocument();
    cell('severity', row({ severity: 'UNHEARD_OF' }));
    expect(screen.getByText('UNHEARD_OF')).toBeInTheDocument();
  });

  it('writes the type as words and the message over its rule', () => {
    cell('type', row());
    expect(screen.getByText('CODE SMELL')).toBeInTheDocument();
    cell('message', row());
    expect(screen.getByText('Extract this nested ternary')).toBeInTheDocument();
    expect(screen.getByText('typescript:S3358')).toBeInTheDocument();
  });

  it('places an issue at its file and line, its file, or the project', () => {
    cell('file', row());
    expect(screen.getByText('src/app.ts:12')).toBeInTheDocument();
    cell('file', row({ line: null }));
    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
    cell('file', row({ file: '' }));
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('links to the issue in a new tab, named by its rule and place', () => {
    cell('url', row({ file: '' }));
    const link = screen.getByRole('link', {
      name: 'Open in SonarQube: typescript:S3358 at — (new tab)',
    });
    expect(link).toHaveAttribute('href', `${HOST}/project/issues?id=exyconn&open=I1`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('Open in SonarQube');
  });
});
