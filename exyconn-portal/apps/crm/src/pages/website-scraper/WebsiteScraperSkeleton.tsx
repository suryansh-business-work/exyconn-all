import { Stack } from '@exyconn/shell/components/ui';
import {
  FormSkeleton,
  ListSkeleton,
  SkeletonStatus,
} from '@exyconn/shell/components/feedback/skeletons';

/** The website scraper while it checks Firecrawl is configured: the URL form above the list. */
export function WebsiteScraperSkeleton() {
  return (
    <SkeletonStatus label="Loading the website scraper">
      <Stack spacing={2}>
        <FormSkeleton fields={1} />
        <ListSkeleton rows={6} columns={5} />
      </Stack>
    </SkeletonStatus>
  );
}
