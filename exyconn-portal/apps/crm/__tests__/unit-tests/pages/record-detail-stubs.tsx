/**
 * Stand-ins for the record-page pieces that load data of their own (timeline, AI summary,
 * email threads, tags, custom values, map, reach-out). They have their own tests; here each
 * prints what the company or contact page handed it, so a page test can assert the wiring.
 */
export const detailStubs = {
  Timeline: ({ object, id, limit }: Readonly<{ object: string; id: string; limit: number }>) => (
    <p>{`Timeline of ${object} ${id}, last ${limit}`}</p>
  ),
  AiSummary: ({ name }: Readonly<{ name: string }>) => <p>{`AI summary of ${name}`}</p>,
  EmailThreads: ({ id, defaultTo }: Readonly<{ id: string; defaultTo: string[] }>) => (
    <p>{`Email threads of ${id} to [${defaultTo.join(', ')}]`}</p>
  ),
  DetailActions: ({
    target,
  }: Readonly<{ target: { relatedType: string; relatedId: string; relatedName: string } }>) => (
    <p>{`Actions for ${target.relatedType} ${target.relatedId} ${target.relatedName}`}</p>
  ),
  TagsEditor: ({ id, tags }: Readonly<{ id: string; tags: readonly string[] }>) => (
    <p>{`Tags of ${id}: ${tags.join(', ')}`}</p>
  ),
  CustomValues: ({ values }: Readonly<{ values: Record<string, unknown> }>) => (
    <p>{`Custom values ${JSON.stringify(values)}`}</p>
  ),
};

interface ReachOutRecordStub {
  object: string;
  id: string;
  name: string;
  phones: readonly string[];
  emails: readonly string[];
}

/** `ReachOutActions`: the record it would reach, and its onOpen as a button when given one. */
export function ReachOutStub({
  record,
  onOpen,
}: Readonly<{ record: ReachOutRecordStub; onOpen?: () => void }>) {
  return (
    <div>
      <p>{`Reach ${record.object} ${record.id} ${record.name}: ${[...record.phones, ...record.emails].join(', ')}`}</p>
      {onOpen && (
        <button type="button" onClick={onOpen}>
          Reach out
        </button>
      )}
    </div>
  );
}

/** `GoogleMapCard`: the title it would pin. */
export function MapCardStub({ title }: Readonly<{ title: string; target: unknown }>) {
  return <p>{`Map of ${title}`}</p>;
}

/** `EmailVerifyButton`: which address it would check. */
export function VerifyButtonStub({ email }: Readonly<{ email: string }>) {
  return <span>{`verify ${email}`}</span>;
}

/**
 * The value a `DetailField` shows under the caption `label` (its placeholder when empty), or
 * null when the field rendered nothing.
 */
export function fieldValue(container: HTMLElement, label: string): string | null {
  const caption = [...container.querySelectorAll('div')].find(
    (node) => node.textContent === label && node.nextElementSibling !== null,
  );
  return caption?.nextElementSibling?.textContent ?? null;
}
