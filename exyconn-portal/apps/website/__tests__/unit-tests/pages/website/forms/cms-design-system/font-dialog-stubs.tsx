import type { FontSource } from '../../../../../../src/pages/cms/design-system/font-sources';

/** What the Google stand-in adds. */
export const LORA: FontSource = { provider: 'GOOGLE', family: 'Lora', variants: ['400', '700'] };

/** What the upload stand-in adds. */
export const BRAND_SANS: FontSource = {
  provider: 'CUSTOM',
  family: 'Brand Sans',
  files: [
    { url: 'https://cdn.example.com/brand.woff2', weight: '400', style: 'normal', format: 'woff2' },
  ],
};

interface GoogleFontFormStubProps {
  open: boolean;
  loaded: readonly string[];
  onClose: () => void;
  onAdd: (source: FontSource) => void;
}

/** Stands in for the Google Fonts dialog (tested on its own): shows what it was handed. */
export function GoogleFontFormStub({
  open,
  loaded,
  onClose,
  onAdd,
}: Readonly<GoogleFontFormStubProps>) {
  if (!open) return null;
  return (
    <section aria-label="Google font dialog">
      <p>{`Loaded: ${loaded.join(', ')}`}</p>
      <button type="button" onClick={() => onAdd(LORA)}>
        Add Lora
      </button>
      <button type="button" onClick={onClose}>
        Close Google
      </button>
    </section>
  );
}

interface CustomFontFormStubProps {
  open: boolean;
  siteId: string;
  onClose: () => void;
  onAdd: (source: FontSource) => void;
}

/** Stands in for the upload dialog, whose uploads go to the site's media library. */
export function CustomFontFormStub({
  open,
  siteId,
  onClose,
  onAdd,
}: Readonly<CustomFontFormStubProps>) {
  if (!open) return null;
  return (
    <section aria-label="Custom font dialog">
      <p>{`Site: ${siteId}`}</p>
      <button type="button" onClick={() => onAdd(BRAND_SANS)}>
        Add Brand Sans
      </button>
      <button type="button" onClick={onClose}>
        Close upload
      </button>
    </section>
  );
}
