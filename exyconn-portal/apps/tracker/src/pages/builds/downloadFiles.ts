/**
 * Starts a browser download for each URL. The files are public GitHub release assets, served
 * as attachments, so following each link saves it rather than navigating away; the browser may
 * ask once whether this page is allowed to download several files.
 */
export function downloadFiles(urls: readonly string[]): void {
  for (const url of urls) {
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener';
    link.download = '';
    document.body.append(link);
    link.click();
    link.remove();
  }
}
