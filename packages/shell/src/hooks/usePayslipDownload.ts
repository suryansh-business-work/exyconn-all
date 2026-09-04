import { useCallback } from 'react';
import { useSalarySlipPdfLazyQuery } from '@/graphql/generated';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { downloadBase64File } from '@/utils/file';

/**
 * Downloads one payslip as a PDF.
 *
 * Shared because two screens need exactly this — the employee's own payslips and HR's
 * payroll table — and a second copy would be a second chance for them to disagree about
 * what an employee was paid. The server decides who may download which slip.
 */
export function usePayslipDownload() {
  const notify = useNotify();
  const [fetchPdf, { loading }] = useSalarySlipPdfLazyQuery({ fetchPolicy: 'network-only' });

  const download = useCallback(
    async (slipId: string) => {
      try {
        const { data, error } = await fetchPdf({ variables: { id: slipId } });
        if (error ?? !data) {
          throw error ?? new Error('The payslip could not be generated.');
        }
        const pdf = data.salarySlipPdf;
        downloadBase64File(pdf.filename, pdf.contentType, pdf.contentBase64);
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Could not download the payslip', 'error');
      }
    },
    [fetchPdf, notify],
  );

  return { download, downloading: loading };
}
