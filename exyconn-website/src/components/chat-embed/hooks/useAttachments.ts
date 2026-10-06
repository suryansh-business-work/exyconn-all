import { useCallback, useState } from "react";
import { isTooBig, kindOf, MAX_FILES, readDataUrl } from "../lib/files";
import { strings } from "../strings";
import type { OutgoingFile } from "../types";

/** A picture or clip picked for the next message, with an id the preview list can key on. */
export interface PickedFile extends OutgoingFile {
  id: string;
}

let nextId = 0;

/** Why a file cannot be attached, or null when it can. */
function refusal(file: File, maxMb: number): string | null {
  const kind = kindOf(file.type);
  if (kind !== "IMAGE" && kind !== "VIDEO") {
    return strings.fileType(file.name);
  }
  return isTooBig(file.size, maxMb) ? strings.fileTooBig(file.name, maxMb) : null;
}

/** Pictures and clips for the next live message: checked, read, previewed and removable. */
export function useAttachments(maxMb: number, onError: (message: string) => void) {
  const [files, setFiles] = useState<PickedFile[]>([]);

  const add = useCallback(
    async (picked: readonly File[]) => {
      if (files.length + picked.length > MAX_FILES) {
        onError(strings.tooManyFiles);
        return;
      }
      const accepted: PickedFile[] = [];
      for (const file of picked) {
        const problem = refusal(file, maxMb);
        if (problem) {
          onError(problem);
          return;
        }
        try {
          nextId += 1;
          accepted.push({ id: `file-${nextId}`, name: file.name, data: await readDataUrl(file) });
        } catch (error) {
          console.warn("[chat] could not read a file", error);
          onError(strings.fileUnreadable);
          return;
        }
      }
      setFiles((current) => [...current, ...accepted]);
    },
    [files.length, maxMb, onError]
  );

  const remove = useCallback((id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const clear = useCallback(() => setFiles([]), []);

  return { files, add, remove, clear };
}
