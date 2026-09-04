/**
 * The Exyconn design system. Every portal, the tools site and the desktop tracker
 * import UI primitives from here instead of reaching into `@mui/material`, so
 * defaults and styling live in one place. Direct `@mui/*` imports are blocked
 * everywhere else by the ESLint `no-restricted-imports` guard — add any new
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
  CardMedia,
  Typography,
  Link,
  Divider,
  Chip,
  Avatar,
  Badge,
  Tooltip,
  Toolbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  MenuList,
  Popover,
  InputAdornment,
  InputLabel,
  FormControl,
  FormGroup,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Collapse,
  Fade,
  Grow,
  Zoom,
  Backdrop,
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
  TablePagination,
  TableSortLabel,
  Pagination,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  ButtonBase,
  ButtonGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControlLabel,
  FormHelperText,
  useMediaQuery,
} from '@mui/material';
export type {
  AlertColor,
  PaperProps,
  SelectChangeEvent,
  SliderProps,
  ToggleButtonGroupProps,
  AutocompleteProps,
} from '@mui/material';
// MUI 6 ships the new Grid as `Grid2`; it becomes `Grid` in MUI 7+, when this alias goes.
export { default as Grid2 } from '@mui/material/Grid2';

// MUIX date & time pickers — also importable from '@exyconn/ui/pickers'.
export * from './pickers';

// Styling utilities (styled, theme helpers). The raw MUI `ThemeProvider` is
// deliberately left out of this list — the branded one from `./tokens` below
// takes that name at the barrel level; reach `@exyconn/ui/styles` for the raw one.
export {
  styled,
  keyframes,
  alpha,
  useTheme,
  createTheme,
  CssBaseline,
  type Theme,
  type SxProps,
  type CSSObject,
} from './styles';

// The Exyconn theme itself.
export * from './theme';

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
