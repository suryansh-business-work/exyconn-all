import { gstBreakdown } from '../../src/modules/finance/invoice.lines';
import { invoiceDocument, type InvoicePdfData } from '../../src/modules/finance/invoice.document';
import { GST_STATES, gstStateLabel } from '../../src/modules/finance/gst.constants';

const LINES = [
  { description: 'Design', quantity: 2, rate: 1000, taxPercent: 18, hsnSac: '998314' },
  { description: 'Hosting', quantity: 1, rate: 500, taxPercent: 18 },
];

const data = (overrides: Partial<InvoicePdfData['invoice']> = {}): InvoicePdfData => ({
  company: {
    name: 'Exyconn',
    address: '12 MG Road, Indore',
    supportEmail: 'support@exyconn.com',
    gstin: '23AAACE1234F1Z5',
    stateCode: '23',
    bankDetails: 'HDFC Bank · A/C 1234567890 · IFSC HDFC0000123',
  },
  client: {
    name: 'Priya',
    company: 'Acme',
    email: 'priya@acme.test',
    gstin: '27AAACA9876B1Z2',
    billingAddress: '4 Marine Drive, Mumbai',
  },
  invoice: {
    number: 'INV-0007',
    currency: 'INR',
    status: 'SENT',
    issuedDate: new Date('2026-09-01T00:00:00.000Z'),
    dueDate: new Date('2026-09-30T00:00:00.000Z'),
    lines: LINES,
    amount: 2950,
    amountPaid: 1000,
    placeOfSupplyStateCode: '27',
    supplierStateCode: '23',
    ...overrides,
  },
});

const labels = (fields: readonly { label: string }[]) => fields.map((field) => field.label);

describe('gstBreakdown', () => {
  it('halves the tax into CGST and SGST inside the supplier state', () => {
    const gst = gstBreakdown({ lines: LINES, placeOfSupplyStateCode: '23', supplierStateCode: '23' });

    expect(gst).toEqual({
      subtotal: 2500,
      taxTotal: 450,
      cgst: 225,
      sgst: 225,
      igst: 0,
      intraState: true,
    });
  });

  it('puts the whole tax under IGST for another state', () => {
    const gst = gstBreakdown({ lines: LINES, placeOfSupplyStateCode: '27', supplierStateCode: '23' });

    expect(gst).toMatchObject({ cgst: 0, sgst: 0, igst: 450, intraState: false });
  });

  it('treats a missing place of supply as inter-state rather than guessing', () => {
    expect(gstBreakdown({ lines: LINES, supplierStateCode: '23' }).intraState).toBe(false);
    expect(gstBreakdown({ lines: LINES, placeOfSupplyStateCode: '', supplierStateCode: '' })).toMatchObject({
      igst: 450,
      intraState: false,
    });
  });

  it('keeps the two halves adding back to the tax on an odd paisa', () => {
    const lines = [{ description: 'x', quantity: 1, rate: 100.05, taxPercent: 5 }];
    const gst = gstBreakdown({ lines, placeOfSupplyStateCode: '23', supplierStateCode: '23' });

    expect(gst.cgst + gst.sgst).toBeCloseTo(gst.taxTotal, 2);
  });

  it('is all zeros for an invoice with no lines', () => {
    expect(gstBreakdown({ lines: [] })).toMatchObject({ subtotal: 0, taxTotal: 0, igst: 0 });
  });
});

describe('gst states', () => {
  it('names every state by its two-digit code, once', () => {
    const codes = GST_STATES.map((state) => state.code);
    expect(codes.every((code) => /^\d{2}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
    expect(gstStateLabel('27')).toBe('27 — Maharashtra');
    expect(gstStateLabel('99')).toBe('99');
  });
});

describe('invoiceDocument', () => {
  it('is a tax invoice that names both GSTINs, the addresses and the place of supply', () => {
    const document = invoiceDocument(data());

    expect(document.title).toBe('Tax Invoice');
    expect(document.supplier).toEqual([
      'Exyconn',
      '12 MG Road, Indore',
      'GSTIN: 23AAACE1234F1Z5',
      'support@exyconn.com',
    ]);
    expect(document.parties).toEqual(
      expect.arrayContaining([
        { label: 'Client GSTIN', value: '27AAACA9876B1Z2' },
        { label: 'Billing address', value: '4 Marine Drive, Mumbai' },
        { label: 'Place of supply', value: '27 — Maharashtra' },
      ]),
    );
    expect(document.bankDetails).toBe('HDFC Bank · A/C 1234567890 · IFSC HDFC0000123');
  });

  it('prints the HSN/SAC beside each line', () => {
    const document = invoiceDocument(data());

    expect(document.lines.map((line) => line.hsnSac)).toEqual(['998314', '']);
  });

  it('shows IGST for a supply to another state', () => {
    const document = invoiceDocument(data());

    expect(labels(document.totals)).toEqual([
      'Subtotal',
      'IGST',
      'Total',
      'Amount paid',
      'Balance due',
    ]);
  });

  it('shows CGST and SGST for a supply inside the supplier state', () => {
    const document = invoiceDocument(data({ placeOfSupplyStateCode: '23' }));

    expect(labels(document.totals)).toContain('CGST');
    expect(labels(document.totals)).toContain('SGST');
    expect(labels(document.totals)).not.toContain('IGST');
  });

  it('keeps the plain Tax row for an invoice with no place of supply', () => {
    const document = invoiceDocument(data({ placeOfSupplyStateCode: '' }));

    expect(labels(document.totals)).toContain('Tax');
    expect(labels(document.parties)).not.toContain('Place of supply');
  });

  it('leaves out what is not known rather than printing an empty label', () => {
    const bare = data();
    bare.company.gstin = '';
    bare.company.bankDetails = '';
    bare.client.gstin = '';

    const document = invoiceDocument(bare);

    expect(document.supplier).not.toContain('GSTIN: ');
    expect(labels(document.parties)).not.toContain('Client GSTIN');
    expect(document.bankDetails).toBe('');
  });
});
