import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { SocialPostForm } from './forms/social-post';
import { useComposerData } from './useComposerData';
import { SOCIAL_PATH } from './social.labels';

/** Social › Compose: write once, post to several accounts now, on schedule, or as a draft. */
export function ComposeTab() {
  const t = useT();
  const navigate = useNavigate();
  const { accounts, rules, loading } = useComposerData();
  // A fresh form after each post, so the next one starts empty.
  const [round, setRound] = useState(0);

  if (loading && accounts.length === 0) {
    return (
      <Flex direction="row" alignItems="center" spacing={1} sx={{ py: 3 }}>
        <CircularProgress size={18} aria-label={t('Loading accounts')} />
        <Text size="sm" color="text.secondary">
          {t('Loading…')}
        </Text>
      </Flex>
    );
  }
  return (
    <Box sx={[readingPanel, { maxWidth: 760 }]}>
      <SocialPostForm
        key={round}
        accounts={accounts}
        rules={rules}
        initial={null}
        onDone={() => setRound((n) => n + 1)}
        onCancel={() => navigate(`${SOCIAL_PATH}/posts`)}
      />
    </Box>
  );
}
