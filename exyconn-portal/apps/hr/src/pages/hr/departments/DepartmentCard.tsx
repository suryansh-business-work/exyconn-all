import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import type { DepartmentRow } from '../forms/department';
import type { PositionRow } from '../forms/position';
import { PositionsTable } from './PositionsTable';

interface DepartmentCardProps {
  department: DepartmentRow;
  onEdit: (row: DepartmentRow) => void;
  onDelete: (row: DepartmentRow) => void;
  onAddPosition: (department: string) => void;
  onEditPosition: (row: PositionRow) => void;
  onDeletePosition: (row: PositionRow) => void;
}

/** One department, and inside it the positions people are hired into. */
export function DepartmentCard({
  department,
  onEdit,
  onDelete,
  onAddPosition,
  onEditPosition,
  onDeletePosition,
}: Readonly<DepartmentCardProps>) {
  const t = useT();
  const { positions } = department;
  const filled = positions.reduce((sum, p) => sum + p.filled, 0);
  const approved = positions.reduce((sum, p) => sum + p.headcount, 0);
  const summary = [
    department.headName && t('Head: {name}', { name: department.headName }),
    t('Positions: {count}', { count: positions.length }),
    t('{filled} of {approved} seats filled', { filled, approved }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ minWidth: 0 }}>
          <Flex direction="row" alignItems="center" spacing={1}>
            <Text weight="medium">{department.name}</Text>
            {department.code && <Chip size="small" variant="outlined" label={department.code} />}
          </Flex>
          <Text size="caption" color="text.secondary">
            {summary}
          </Text>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {department.description && (
          <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
            {department.description}
          </Text>
        )}
        <Flex direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAddPosition(department.name)}
          >
            {t('Add position')}
          </Button>
          <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(department)}>
            {t('Edit department')}
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(department)}
          >
            {t('Delete department')}
          </Button>
        </Flex>
        <PositionsTable positions={positions} onEdit={onEditPosition} onDelete={onDeletePosition} />
      </AccordionDetails>
    </Accordion>
  );
}
