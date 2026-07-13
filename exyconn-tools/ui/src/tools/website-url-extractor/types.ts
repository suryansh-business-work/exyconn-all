export interface ExtractedUrl {
  url: string;
  text: string;
  type: 'internal' | 'external';
  isResource: boolean;
}

export interface ExtractionResult {
  totalUrls: number;
  internalCount: number;
  externalCount: number;
  resourceCount: number;
  urls: ExtractedUrl[];
}
