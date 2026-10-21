import { LIST_SECTIONS, TEXT_SECTIONS, plainContent, type NotesContent } from './notes-sections';

/** Translates an English heading — the viewer's `t`, so an export reads in their language. */
type Translate = (source: string) => string;

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Text made safe to place inside HTML: the notes are model output and must never run as markup. */
export function escapeHtml(text: string): string {
  return text.replaceAll(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Every section that has something in it, as heading + prose or heading + items. */
function filledSections(content: NotesContent, t: Translate) {
  const prose = TEXT_SECTIONS.filter((section) => content[section.key].trim()).map((section) => ({
    heading: t(section.label),
    text: content[section.key],
    items: [] as string[],
  }));
  const lists = LIST_SECTIONS.filter((section) => content[section.key].length > 0).map(
    (section) => ({ heading: t(section.label), text: '', items: content[section.key] }),
  );
  return [...prose, ...lists];
}

/** The notes as Markdown: a title, then a heading per section with its prose or bullets. */
export function notesToMarkdown(title: string, content: NotesContent, t: Translate): string {
  const parts = filledSections(content, t).map((section) => {
    const body = section.text || section.items.map((item) => `- ${item}`).join('\n');
    return `## ${section.heading}\n\n${body}`;
  });
  return [`# ${title}`, ...parts].join('\n\n') + '\n';
}

/** The notes as plain text: underlined headings and dashed items. */
export function notesToText(title: string, content: NotesContent, t: Translate): string {
  const parts = filledSections(content, t).map((section) => {
    const body = section.text || section.items.map((item) => `- ${item}`).join('\n');
    return `${section.heading}\n${'-'.repeat(section.heading.length)}\n${body}`;
  });
  return [title, ...parts].join('\n\n') + '\n';
}

/** The notes as JSON: the meeting title and the content exactly as stored. */
export function notesToJson(title: string, content: NotesContent): string {
  return `${JSON.stringify({ title, ...plainContent(content) }, null, 2)}\n`;
}

/** The notes as escaped HTML, which the PDF and Word exporters lay out. */
export function notesToHtml(title: string, content: NotesContent, t: Translate): string {
  const parts = filledSections(content, t).map((section) => {
    const items = section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const body = section.text ? `<p>${escapeHtml(section.text)}</p>` : `<ul>${items}</ul>`;
    return `<h2>${escapeHtml(section.heading)}</h2>${body}`;
  });
  return `<h1>${escapeHtml(title)}</h1>${parts.join('')}`;
}

/** A meeting title as a file name: characters no file system accepts become dashes. */
export function fileName(title: string, extension: string): string {
  const stem = title.trim().replaceAll(/[\\/:*?"<>|]/g, '-') || 'meeting-notes';
  return `${stem}.${extension}`;
}

/** Hands the browser a text file to save. */
export function saveTextFile(fileName: string, mimeType: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mimeType};charset=utf-8` }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
