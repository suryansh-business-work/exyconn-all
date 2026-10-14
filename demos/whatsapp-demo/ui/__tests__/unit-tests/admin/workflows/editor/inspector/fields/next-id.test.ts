import {
  OPTION_ID_MAX,
  nextId,
} from '../../../../../../../src/admin/workflows/editor/inspector/fields/next-id';

describe('nextId', () => {
  it('numbers the first item 1', () => {
    expect(nextId('button', [])).toBe('button-1');
  });

  it('follows the item count when that id is free', () => {
    expect(nextId('row', [{ id: 'yes' }, { id: 'no' }])).toBe('row-3');
  });

  it('skips ids already taken', () => {
    expect(nextId('case', [{ id: 'case-2' }, { id: 'case-3' }])).toBe('case-4');
  });

  it('reads another key and tolerates items without it', () => {
    expect(nextId('value', [{ name: 'value-2' }, {}], 'name')).toBe('value-3');
  });

  it('caps option ids at the schema limit', () => {
    expect(OPTION_ID_MAX).toBe(64);
  });
});
