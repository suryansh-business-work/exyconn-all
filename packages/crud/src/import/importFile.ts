import { useCallback } from 'react';
import type { Interpolations } from '@exyconn/i18n';
import { useParseTableFileMutation } from '@exyconn/shell/graphql/generated';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import type { ImportFile } from './import.types';

/** The largest file the wizard sends; the server refuses anything bigger too. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** What the file picker offers: CSV and Excel workbooks. */
export const ACCEPTED_FILES =
  '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
/** The file line of the first data row: the header is line 1. */
export const FIRST_DATA_LINE = 2;

/** A file refused before it was sent, as English copy for `t()` with its values. */
export class ImportFileError extends Error {
  constructor(
    message: string,
    readonly values?: Interpolations,
  ) {
    super(message);
  }
}

/**
 * Reads a chosen CSV or XLSX on the server (`parseTableFile`), which checks its header and
 * size and hands back its rows. Nothing is imported yet.
 */
export function useImportFileReader(): (file: File) => Promise<ImportFile> {
  const [parse] = useParseTableFileMutation();
  return useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        throw new ImportFileError('{file} is larger than 10 MB. Split it into smaller files.', {
          file: file.name,
        });
      }
      const dataUrl = await fileToDataUrl(file);
      const contentBase64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const { data } = await parse({ variables: { fileName: file.name, contentBase64 } });
      if (!data) {
        throw new Error('The file could not be read.');
      }
      return { name: file.name, ...data.parseTableFile };
    },
    [parse],
  );
}
