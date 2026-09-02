export { PortalApp } from './app/PortalApp';
export { ProtectedRoute } from './routes/ProtectedRoute';
export { ExternalRedirect } from './routes/ExternalRedirect';
export { ROLES, canAccess, type Role } from './auth/roles';
export { useAuth } from './auth/AuthContext';
export { PORTAL_APPS, appOrigin, appUrl, HUB_URL, type PortalAppKey } from './config/apps';
export { MODULES, accessibleModules, moduleUrl, appForPath } from './config/modules';
export type { ModuleDefinition, ModuleChild } from './config/modules';
export { env } from './config/env';
