import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AutoFixHigh, Cloud, Memory } from '@mui/icons-material';
import ProviderOption from './ProviderOption';
import { readSecret, writeSecret } from '../../../../shared/services/secrets';

const REMOVEBG_KEY = 'removebg_api_key';

const isLocalDev = import.meta.env.DEV;
const API_URL = isLocalDev
  ? 'http://localhost:4002'
  : import.meta.env.VITE_API_BASE_URL || 'https://tools-api.exyconn.com';

export type BgRemovalProvider = 'imgly' | 'removebg';

interface Props {
  open: boolean;
  onClose: () => void;
  currentImage: string;
  onSuccess: (processedImage: string) => void;
}

const BackgroundRemovalDialog: React.FC<Props> = ({ open, onClose, currentImage, onSuccess }) => {
  const [provider, setProvider] = useState<BgRemovalProvider>('removebg');
  const [removeBgApiKey, setRemoveBgApiKey] = useState<string>(() => readSecret(REMOVEBG_KEY));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiKeyChange = (value: string) => {
    setRemoveBgApiKey(value);
    writeSecret(REMOVEBG_KEY, value);
  };

  const handleRemoveBackground = async () => {
    if (!currentImage) return;
    if (provider === 'removebg' && !removeBgApiKey.trim()) {
      setError('Please enter your Remove.bg API key');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const endpoint =
        provider === 'imgly'
          ? `${API_URL}/api/tools/logo-set/remove-background-base64`
          : `${API_URL}/api/tools/logo-set/remove-background-removebg`;
      const body = provider === 'imgly' ? { image: currentImage } : { image: currentImage, apiKey: removeBgApiKey };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success && result.image) {
        onSuccess(result.image);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to remove background');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoFixHigh color="secondary" /> Remove Background
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a background removal service:
        </Typography>
        <RadioGroup
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as BgRemovalProvider);
            setError(null);
          }}
        >
          <ProviderOption
            value="removebg"
            currentProvider={provider}
            icon={<Cloud color="primary" />}
            title="Remove.bg"
            description="Professional AI-powered background removal. Requires API key (free tier available)."
            chips={[{ label: 'Recommended', color: 'success' }]}
            onSelect={() => setProvider('removebg')}
            apiKeyField={{
              value: removeBgApiKey,
              onChange: handleApiKeyChange,
              helperText: (
                <Typography variant="caption">
                  Get your free API key at{' '}
                  <a
                    href="https://www.remove.bg/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2' }}
                  >
                    remove.bg/api
                  </a>
                </Typography>
              ),
            }}
          />
          <ProviderOption
            value="imgly"
            currentProvider={provider}
            icon={<Memory color="secondary" />}
            title="IMG.LY (Local)"
            description="Local processing using @imgly/background-removal. No API key needed but may have compatibility issues."
            chips={[
              { label: 'Free', color: 'info' },
              { label: 'May not work', color: 'warning' },
            ]}
            onSelect={() => setProvider('imgly')}
            opacity={0.7}
          />
        </RadioGroup>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRemoveBackground}
          disabled={isProcessing || (provider === 'removebg' && !removeBgApiKey.trim())}
          startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : <AutoFixHigh />}
        >
          {isProcessing ? 'Processing...' : 'Remove Background'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackgroundRemovalDialog;
