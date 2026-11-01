import { describe, expect, it } from 'vitest';
import { WebsiteChatKnowledgeSource } from '@exyconn/shell/graphql/generated';
import {
  CHAT_KNOWLEDGE_COLUMNS,
  SOURCE_LABEL,
} from '../../../../../src/pages/chat/knowledge/chat-knowledge-grid';
import { knowledgeRow } from '../chat-fixtures';
import { actionKeys, cellValue, columnIds, formatCell } from '../crud-stubs';

describe('chat knowledge grid', () => {
  it('names where an entry came from as the team says it', () => {
    expect(SOURCE_LABEL).toEqual({
      [WebsiteChatKnowledgeSource.Website]: 'Website',
      [WebsiteChatKnowledgeSource.Custom]: 'Custom',
    });
  });

  it('lists source, status, title, link and the last update, then edit and delete', () => {
    expect(columnIds(CHAT_KNOWLEDGE_COLUMNS)).toEqual([
      'source',
      'isActive',
      'title',
      'url',
      'updatedAt',
      'actions',
    ]);
    expect(actionKeys(CHAT_KNOWLEDGE_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('shows the source and whether the bot may use the entry as chips', () => {
    const fromSite = knowledgeRow({ source: WebsiteChatKnowledgeSource.Website, isActive: false });

    expect(cellValue(CHAT_KNOWLEDGE_COLUMNS, 'source', fromSite)).toBe('Website');
    expect(cellValue(CHAT_KNOWLEDGE_COLUMNS, 'source', knowledgeRow())).toBe('Custom');
    expect(cellValue(CHAT_KNOWLEDGE_COLUMNS, 'isActive', fromSite)).toBe('INACTIVE');
    expect(cellValue(CHAT_KNOWLEDGE_COLUMNS, 'isActive', knowledgeRow())).toBe('ACTIVE');
  });

  it('writes the title and the link, and does not sort by link', () => {
    const row = knowledgeRow();

    expect(formatCell(CHAT_KNOWLEDGE_COLUMNS, 'title', row)).toBe('Pricing');
    expect(formatCell(CHAT_KNOWLEDGE_COLUMNS, 'url', row)).toBe('https://exyconn.com/pricing');
    const link = CHAT_KNOWLEDGE_COLUMNS.find((column) => column.field === 'url');
    expect(link?.sortable).toBe(false);
  });
});
