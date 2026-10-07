import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NameserversForm } from '../../../../../../../src/pages/security/cloudflare/forms/nameservers';
import { nameServerLines } from '../../../../../../../src/pages/security/cloudflare/forms/nameservers/nameservers.form';
import { renderWithProviders } from '../../../../../test-utils';

const onSubmit = vi.fn<(nameServers: string[]) => Promise<void>>();
const onCancel = vi.fn();

const renderForm = (
  current: readonly string[] = ['ns01.domaincontrol.com', 'ns02.domaincontrol.com'],
) =>
  renderWithProviders(
    <NameserversForm current={current} onSubmit={onSubmit} onCancel={onCancel} />,
  );

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText('Nameservers'), { target: { value } });
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Set nameservers' }));

describe('nameServerLines', () => {
  it('reads one lower-case host per line without trailing dots or blanks', () => {
    expect(nameServerLines('  NS1.Example.com.\n\n ns2.example.com \n   ')).toEqual([
      'ns1.example.com',
      'ns2.example.com',
    ]);
  });

  it('reads nothing from an empty value', () => {
    expect(nameServerLines('')).toEqual([]);
  });
});

describe('NameserversForm', () => {
  beforeEach(() => {
    onSubmit.mockReset().mockResolvedValue(undefined);
    onCancel.mockReset();
  });

  it('starts from the nameservers the registry holds now', () => {
    renderForm();
    expect(screen.getByLabelText('Nameservers')).toHaveValue(
      'ns01.domaincontrol.com\nns02.domaincontrol.com',
    );
    expect(screen.getByText(/One host per line/)).toBeInTheDocument();
  });

  it('submits the typed hosts, cleaned up', async () => {
    renderForm();
    type('NS1.Own.dev.\n\nns2.own.dev');
    await submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(['ns1.own.dev', 'ns2.own.dev']));
  });

  it('asks for at least two nameservers', async () => {
    renderForm([]);
    type('ns1.own.dev');
    await submit();
    expect(
      await screen.findByText('Enter at least 2 nameservers, one per line'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts no more than thirteen', async () => {
    renderForm();
    type(Array.from({ length: 14 }, (_, index) => `ns${index}.own.dev`).join('\n'));
    await submit();
    expect(await screen.findByText('Enter at most 13 nameservers')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts exactly thirteen', async () => {
    renderForm();
    type(Array.from({ length: 13 }, (_, index) => `ns${index}.own.dev`).join('\n'));
    await submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.lastCall?.[0]).toHaveLength(13);
  });

  it('refuses a line that is not a host name', async () => {
    renderForm();
    type('ns1.own.dev\nnot a host');
    await submit();
    expect(
      await screen.findByText('Each line must be a host name, e.g. ns1.example.com'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
