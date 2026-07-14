/**
 * Internal design system. The portal imports UI primitives from here (via the
 * `@ui` / `@/components/ui` alias) instead of reaching into `@mui/material`
 * directly, so defaults and styling live in one place. Direct `@mui/material`
 * imports are blocked by the ESLint `no-restricted-imports` guard — add any new
 * primitive here first.
 *
 * Exception: icons stay as direct `@mui/icons-material/X` imports (tree-shaking;
 * wrapping 100+ icons is anti-idiomatic).
 */

// Branded wrappers (single place to tune app-wide defaults).
export { Button, type ButtonProps } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { AppBar, type AppBarProps } from './AppBar';
export { Drawer, type DrawerProps } from './Drawer';
export { TextField, type TextFieldProps } from './TextField';

// Pass-through MUI primitives, re-exported so there is a single import source.
// Note: `Card` itself is NOT re-exported here — the branded superset from
// `./cards` replaces it below (same props, plus default styling).
export {
  Box,
  Stack,
  Grid,
  Paper,
  CardActionArea,
  CardContent,
  Typography,
  Link,
  Divider,
  Chip,
  Avatar,
  Tooltip,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Collapse,
  Autocomplete,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
export type { AlertColor } from '@mui/material';

// MUIX date & time pickers (CLAUDE.md rule 11). The date-fns adapter is wired
// once in App.tsx via LocalizationProvider.
export { LocalizationProvider } from '@mui/x-date-pickers';
export { DatePicker } from '@mui/x-date-pickers/DatePicker';
export { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
export { TimePicker } from '@mui/x-date-pickers/TimePicker';

// Styling utilities (styled, theme helpers). `ThemeProvider` is deliberately
// left out of this wildcard — the branded one from `./tokens` below takes
// that name at the barrel level (nothing imports the raw one from here today;
// existing call sites reach `@/components/ui/styles` directly).
export { styled, alpha, useTheme, createTheme, type Theme } from './styles';

// Design-system additions: tokens (scales + a standalone ThemeProvider for
// isolated mounts), typography, spacing, layout, inputs, and cards. Each
// subfolder is a self-contained group of branded wrappers — see its own
// index.ts for the exact primitives.
export * from './tokens';
export * from './typography';
export * from './spacing';
export * from './layout';
export * from './inputs';
export {
  Card,
  type CardProps,
  CardHeader,
  type CardHeaderProps,
  CardFooter,
  type CardFooterProps,
} from './cards';

// Shared image picker + ImageKit uploader used by every image field.
export { ImageUploadDialog, ImagePreview } from './ImageUploadDialog';
