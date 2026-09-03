# @exyconn/tabber

Tabs for the portal, with the active tab in the URL.

Every tab set goes through this package, so they all look the same (MUI `Tabs`
underneath) and all behave the same: the selected tab is a slug in the route,
not component state, so a tab can be linked to, bookmarked, reloaded and walked
with the back button.

## Use it

Give the route an optional tab segment, then hand `Tabber` the same base path:

```tsx
<Route path="/environment-variables/:tab?" element={<EnvironmentVariablesPage />} />
```

```tsx
import { Tabber, type TabberItem } from '@exyconn/tabber';

const TABS: TabberItem[] = [
  { slug: 'slack', label: 'Slack', icon: <ChatIcon />, content: <SlackConfigsPanel /> },
  { slug: 'imagekit', label: 'ImageKit', icon: <ImageIcon />, content: <ImageConfigsPanel /> },
];

<Tabber basePath="/environment-variables" items={TABS} ariaLabel="Integration settings" />;
```

Landing on `/environment-variables` rewrites the URL to the first tab with
`replace`, so the correction never becomes its own history entry.

When the page renders its own body from the active tab rather than a panel per
tab, use the hook instead:

```tsx
const { slug, selectSlug } = useTabberSlug('/hr/reports', REPORT_KEYS);
```

## Sidebar highlighting

Because a tab adds a segment to the path, the sidebar matches the **longest**
nav path that prefixes the current URL rather than an exact match, so
`/environment-variables/slack` still highlights Environment Variables. That
lives in `@exyconn/shell` (`layout/PortalLayout/activeNavPath`).
