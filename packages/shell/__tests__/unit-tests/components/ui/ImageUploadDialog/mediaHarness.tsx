import type { ReactNode } from 'react';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { I18nProvider } from '@exyconn/i18n';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { ImportMediaFromUrlDocument, UploadImageDocument } from '@/graphql/generated';

/** Apollo (mocked), i18n and the notifier: what useMediaUpload needs around it. */
export function mediaWrapper(mocks: ReadonlyArray<MockLink.MockedResponse>) {
  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <MockedProvider mocks={mocks}>
        <I18nProvider locale="en" messages={{}}>
          <NotificationProvider>{children}</NotificationProvider>
        </I18nProvider>
      </MockedProvider>
    );
  };
}

type Outcome = { url: string | null } | { error: Error };

const respond = (field: string, outcome: Outcome) =>
  'error' in outcome ? { error: outcome.error } : { result: { data: { [field]: outcome.url } } };

/** The uploadImage mutation for one file, answering with a URL, null or a failure. */
export function uploadMock(
  variables: { file: string; fileName: string; folder?: string },
  outcome: Outcome,
): MockLink.MockedResponse {
  return { request: { query: UploadImageDocument, variables }, ...respond('uploadImage', outcome) };
}

/** The importMediaFromUrl mutation for one stock clip. */
export function importMock(
  variables: { url: string; fileName: string; folder?: string },
  outcome: Outcome,
): MockLink.MockedResponse {
  return {
    request: { query: ImportMediaFromUrlDocument, variables },
    ...respond('importMediaFromUrl', outcome),
  };
}

/** A change event from a file input, as the picker hands it over. */
export function fileEvent(file?: File): React.ChangeEvent<HTMLInputElement> {
  const target = { files: file ? [file] : [], value: String.raw`C:\fakepath\picked` };
  return { target } as unknown as React.ChangeEvent<HTMLInputElement>;
}

/** The base64 data URL FileReader produces for `text`. */
export const dataUrlOf = (type: string, text: string) => `data:${type};base64,${btoa(text)}`;
