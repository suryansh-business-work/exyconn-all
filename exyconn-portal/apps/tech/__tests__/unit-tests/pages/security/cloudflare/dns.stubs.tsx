import { vi } from 'vitest';
import type {
  DnsOverview,
  DnsRecordRow,
} from '../../../../../src/pages/security/cloudflare/dns.types';

/** The last props each panel stand-in rendered with. */
export const panels = {
  nameservers:
    vi.fn<(props: { overview: DnsOverview; onChanged: () => Promise<unknown> }) => void>(),
  shift: vi.fn<(props: { overview: DnsOverview; onChanged: () => Promise<unknown> }) => void>(),
  records:
    vi.fn<
      (props: {
        records: readonly DnsRecordRow[];
        hasZone: boolean;
        loading: boolean;
        onRefresh: () => Promise<unknown>;
      }) => void
    >(),
};

export function NameserverPanelStub(
  props: Readonly<{ overview: DnsOverview; onChanged: () => Promise<unknown> }>,
) {
  panels.nameservers(props);
  return <p>Nameservers of {props.overview.domain}</p>;
}

export function ShiftPanelStub(
  props: Readonly<{ overview: DnsOverview; onChanged: () => Promise<unknown> }>,
) {
  panels.shift(props);
  return <p>Shift for {props.overview.domain}</p>;
}

export function RecordsCompareStub(
  props: Readonly<{
    records: readonly DnsRecordRow[];
    hasZone: boolean;
    loading: boolean;
    onRefresh: () => Promise<unknown>;
  }>,
) {
  panels.records(props);
  return <p>{props.records.length} records compared</p>;
}

/** Stands in for the domain view the page mounts, naming the domain it was given. */
export function DomainDnsViewStub({ domain }: Readonly<{ domain: string }>) {
  return <p>DNS view for {domain}</p>;
}

/** Stands in for the custom-nameserver form: shows what it was prefilled with and submits fixed hosts. */
export function NameserversFormStub({
  current,
  onSubmit,
  onCancel,
}: Readonly<{
  current: readonly string[];
  onSubmit: (nameServers: string[]) => Promise<void>;
  onCancel: () => void;
}>) {
  return (
    <div>
      <p>Prefilled: {current.join(' ')}</p>
      <button type="button" onClick={() => onSubmit(['ns1.own.dev', 'ns2.own.dev'])}>
        Submit custom
      </button>
      <button type="button" onClick={onCancel}>
        Cancel custom
      </button>
    </div>
  );
}
