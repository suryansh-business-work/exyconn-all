import { describe, expect, it } from 'vitest';
import { CHAT_FAQ_COLUMNS } from '../../../../../src/pages/chat/faqs/chat-faqs-grid';
import { faqRow } from '../chat-fixtures';
import { actionKeys, cellValue, columnIds, formatCell } from '../crud-stubs';

describe('CHAT_FAQ_COLUMNS', () => {
  it('lists question, answer, order, status and the last update, then edit and delete', () => {
    expect(columnIds(CHAT_FAQ_COLUMNS)).toEqual([
      'question',
      'answer',
      'sortOrder',
      'isActive',
      'updatedAt',
      'actions',
    ]);
    expect(actionKeys(CHAT_FAQ_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('writes each FAQ’s question, answer and order', () => {
    const row = faqRow({ sortOrder: 7 });

    expect(formatCell(CHAT_FAQ_COLUMNS, 'question', row)).toBe('Do you build AI agents?');
    expect(formatCell(CHAT_FAQ_COLUMNS, 'answer', row)).toBe(
      'Yes, for sales, support and operations.',
    );
    expect(formatCell(CHAT_FAQ_COLUMNS, 'sortOrder', row)).toBe('7');
  });

  it('keeps long answers out of sorting and gives the text columns room', () => {
    const [question, answer] = CHAT_FAQ_COLUMNS;
    expect(answer.sortable).toBe(false);
    expect(question.minWidth).toBe(240);
    expect(answer.minWidth).toBe(280);
  });

  it('shows whether the FAQ is in the widget as a status', () => {
    expect(cellValue(CHAT_FAQ_COLUMNS, 'isActive', faqRow())).toBe('ACTIVE');
    expect(cellValue(CHAT_FAQ_COLUMNS, 'isActive', faqRow({ isActive: false }))).toBe('INACTIVE');
  });
});
