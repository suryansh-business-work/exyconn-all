import { render, screen, within } from '@testing-library/react';
import { ProblemsList } from '../../src/ProblemsList';
import type { CodeProblem } from '../../src/types';

const problem = (line: number, message = `Problem on ${line}`): CodeProblem => ({
  line,
  column: 2,
  message,
  severity: 'error',
});

describe('ProblemsList', () => {
  it('says there are no problems when the code is clean', () => {
    render(<ProblemsList problems={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('No problems found');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists each finding with where it is', () => {
    render(<ProblemsList problems={[problem(3, 'Missing comma')]} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('1 problem(s) found');
    expect(within(status).getByRole('listitem')).toHaveTextContent(
      'Line 3, column 2: Missing comma',
    );
  });

  it('lists the first five findings while counting them all', () => {
    const problems = [1, 2, 3, 4, 5, 6, 7].map((line) => problem(line));
    render(<ProblemsList problems={problems} />);
    expect(screen.getByRole('status')).toHaveTextContent('7 problem(s) found');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[4]).toHaveTextContent('Line 5, column 2: Problem on 5');
  });
});
