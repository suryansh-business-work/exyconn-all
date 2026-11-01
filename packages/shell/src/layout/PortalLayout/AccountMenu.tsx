import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Menu, MenuItem } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { ROLES, canAccess } from '@/auth/roles';
import { appUrl } from '@/config/apps';
import { useInstallPrompt } from '@/pwa';

/** The company's calling, SMS and mailbox integrations: a CRM page, reachable from every portal. */
export const INTEGRATIONS_PATH = '/integrations';

interface AccountMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

/**
 * The avatar's menu: who is signed in, their profile and settings, the company's integrations
 * (for people with CRM access, from any portal), installing the app, and signing out.
 */
export function AccountMenu({ anchorEl, onClose }: Readonly<AccountMenuProps>) {
  const { user, signOut } = useAuth();
  const install = useInstallPrompt();
  const t = useT();
  const navigate = useNavigate();
  const integrations = canAccess(user?.roles ?? [], ROLES.CRM, user?.planRoles);

  const go = (path: string) => () => {
    onClose();
    navigate(path);
  };

  /** In the CRM portal the page is a route away; from any other portal it is the CRM's page. */
  const openIntegrations = () => {
    onClose();
    const target = appUrl('crm', INTEGRATIONS_PATH);
    if (target.startsWith('/')) {
      navigate(target);
    } else {
      globalThis.location.assign(target);
    }
  };

  const handleInstall = () => {
    onClose();
    install.install();
  };

  const handleSignOut = () => {
    onClose();
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem disabled>{user?.email}</MenuItem>
      <MenuItem onClick={go('/profile')}>{t('Profile')}</MenuItem>
      <MenuItem onClick={go('/settings')}>{t('Settings')}</MenuItem>
      {integrations && <MenuItem onClick={openIntegrations}>{t('Integrations')}</MenuItem>}
      {/* Only where the browser has told us it would take: see useInstallPrompt. */}
      {install.available && <MenuItem onClick={handleInstall}>{t('Install app')}</MenuItem>}
      <MenuItem onClick={handleSignOut}>{t('Sign out')}</MenuItem>
    </Menu>
  );
}
