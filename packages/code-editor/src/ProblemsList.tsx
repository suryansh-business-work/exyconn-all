import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/ui';
import type { CodeProblem } from './types';

/** How many findings are listed; the count still covers all of them. */
const SHOWN = 5;

interface ProblemsListProps {
  problems: readonly CodeProblem[];
}

/** The editor's verdict on the code: "No problems", or the first findings with where they are. */
export function ProblemsList({ problems }: Readonly<ProblemsListProps>) {
  const t = useT();
  if (problems.length === 0) {
    return (
      <Flex alignItems="center" gap={0.5} role="status" sx={{ color: 'success.main', mt: 0.5 }}>
        <CheckCircleOutlineIcon fontSize="inherit" />
        <Text size="caption">{t('No problems found')}</Text>
      </Flex>
    );
  }
  return (
    <Box role="status" sx={{ color: 'error.main', mt: 0.5 }}>
      <Flex alignItems="center" gap={0.5}>
        <ErrorOutlineIcon fontSize="inherit" />
        <Text size="caption" weight="semibold">
          {t('{count} problem(s) found', { count: String(problems.length) })}
        </Text>
      </Flex>
      <Box component="ul" sx={{ m: 0, pl: 3 }}>
        {problems.slice(0, SHOWN).map((problem) => (
          <Box
            component="li"
            key={`${problem.line}:${problem.column}:${problem.message}`}
            sx={{ typography: 'caption' }}
          >
            {t('Line {line}, column {column}: {message}', {
              line: String(problem.line),
              column: String(problem.column),
              message: problem.message,
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
