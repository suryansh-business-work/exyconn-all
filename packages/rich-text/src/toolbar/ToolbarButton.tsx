import type { ReactNode } from 'react';
import { IconButton, Tooltip } from '@exyconn/ui';

interface ToolbarButtonProps {
  label: string;
  /** Toggle state — omitted for one-shot commands, which are not toggles. */
  active?: boolean;
  disabled?: boolean;
  /** Set when the button opens a menu, so assistive tech announces it as such. */
  hasPopup?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

/** One MUI icon button in the rich-text toolbar (TipTap ships headless). */
export function ToolbarButton({
  label,
  active,
  disabled,
  hasPopup,
  onClick,
  children,
}: Readonly<ToolbarButtonProps>) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          size="small"
          aria-label={label}
          aria-pressed={active}
          aria-haspopup={hasPopup ? 'menu' : undefined}
          disabled={disabled}
          color={active ? 'primary' : 'default'}
          onClick={onClick}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
