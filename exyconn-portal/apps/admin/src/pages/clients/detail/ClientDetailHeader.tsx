import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Heading, Link, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailIcon from '@mui/icons-material/EmailOutlined';
import { EmailClientForm } from './forms/email-client';
import { CLIENTS_PATH } from './client-detail.paths';
import type { ClientDetail } from './client-detail.types';

interface ClientDetailHeaderProps {
  client: ClientDetail;
  /** Told after an email went out — it lands in the communication log. */
  onEmailed: () => void;
}

/** The client's name, status and main address, a way back to the list, and "Email client". */
export function ClientDetailHeader({ client, onEmailed }: Readonly<ClientDetailHeaderProps>) {
  const t = useT();
  const [emailing, setEmailing] = useState(false);
  const sent = () => {
    setEmailing(false);
    onEmailed();
  };
  return (
    <Stack spacing={1}>
      <Link
        component={RouterLink}
        to={CLIENTS_PATH}
        underline="hover"
        sx={{ alignSelf: 'flex-start' }}
      >
        <Flex direction="row" spacing={0.5} alignItems="center">
          <ArrowBackIcon fontSize="small" />
          <span>{t('Back to clients')}</span>
        </Flex>
      </Link>
      <Flex
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Flex direction="row" spacing={1} alignItems="center">
            <Heading level={4}>{client.company || client.name}</Heading>
            <StatusChip value={client.status} />
          </Flex>
          <Text color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {[client.name, client.email, client.phone].filter(Boolean).join(' · ')}
          </Text>
        </Stack>
        <Button variant="contained" startIcon={<MailIcon />} onClick={() => setEmailing(true)}>
          {t('Email client')}
        </Button>
      </Flex>
      <CrudDialog open={emailing} title={t('Email client')} onClose={() => setEmailing(false)}>
        <EmailClientForm clientId={client.id} onDone={sent} onCancel={() => setEmailing(false)} />
      </CrudDialog>
    </Stack>
  );
}
