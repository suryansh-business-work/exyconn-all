/** Lower case with accents dropped, so a search for "resume" finds "Résumé". */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
