import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { apolloClient } from './config/apolloClient';
import { ColorModeProvider } from './theme/ColorModeContext';
import { AuthProvider } from './auth/AuthContext';
import { NotificationProvider } from './components/feedback/NotificationProvider';
import { ConfirmProvider } from './components/feedback/ConfirmProvider';
import { AppRoutes } from './routes/AppRoutes';

/** Composes the app-wide providers (singleton client, theme, auth, feedback). */
export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ColorModeProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <AuthProvider>
                  <AppRoutes />
                </AuthProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </ColorModeProvider>
    </ApolloProvider>
  );
}
