import { useState } from 'react';

interface ComposerProps {
  accounts: readonly unknown[];
  rules: readonly unknown[];
  initial: { id: string } | null;
  schedule?: { accountIds: readonly string[]; scheduledAt: string };
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Stands in for SocialPostForm (which has its own tests): says what it was opened with, holds
 * a little state of its own so a test can see it start afresh, and exposes its callbacks.
 */
export function ComposerStub({
  accounts,
  rules,
  initial,
  schedule,
  onDone,
  onCancel,
}: Readonly<ComposerProps>) {
  const [typed, setTyped] = useState(false);
  const subject = initial ? `edit ${initial.id}` : 'new';
  return (
    <div>
      <p>{`${accounts.length} accounts, ${rules.length} rules, ${subject}`}</p>
      {schedule && (
        <p>{`Planned for ${schedule.accountIds.join('+')} at ${schedule.scheduledAt}`}</p>
      )}
      <button type="button" onClick={() => setTyped(true)}>
        Type something
      </button>
      {typed && <p>Half-written post</p>}
      <button type="button" onClick={onDone}>
        Finish form
      </button>
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
    </div>
  );
}
