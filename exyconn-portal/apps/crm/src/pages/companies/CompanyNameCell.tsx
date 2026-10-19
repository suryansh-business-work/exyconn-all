import type { ICellRendererParams } from 'ag-grid-community';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { RecordAvatar } from '../../records/detail/RecordAvatar';

/** What the cell reads from a company row. */
export interface CompanyNameRow {
  name: string;
  logoUrl: string;
  domain: string;
}

/** The company's name in a list, after its logo (or favicon, or initials). */
export function CompanyNameCell(params: Readonly<ICellRendererParams<CompanyNameRow>>) {
  const row = params.data;
  if (!row) {
    return null;
  }
  return (
    <Flex direction="row" alignItems="center" spacing={1} sx={{ height: '100%', minWidth: 0 }}>
      <RecordAvatar
        name={row.name}
        src={row.logoUrl}
        domain={row.domain}
        variant="rounded"
        sx={{ width: 24, height: 24, fontSize: 'caption.fontSize' }}
      />
      <Text noWrap sx={{ minWidth: 0 }}>
        {row.name}
      </Text>
    </Flex>
  );
}
