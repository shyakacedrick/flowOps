import { describe, expect, it } from 'vitest';
import { toCsv } from '@/shared/utils/csv.js';

describe('toCsv', () => {
  it('emits a header row even when rows is empty', () => {
    const out = toCsv([], ['a', 'b']);
    expect(out).toBe('a,b');
  });

  it('returns empty string when columns are missing', () => {
    expect(toCsv([{ a: 1 }], [])).toBe('');
  });

  it('serializes plain rows with CRLF line endings', () => {
    const out = toCsv([{ a: 1, b: 2 }, { a: 3, b: 4 }], ['a', 'b']);
    expect(out).toBe('a,b\r\n1,2\r\n3,4');
  });

  it('quotes fields that contain commas, quotes, or newlines', () => {
    const out = toCsv(
      [{ name: 'Smith, John', note: 'He said "hi"\nthen left' }],
      ['name', 'note'],
    );
    expect(out).toBe('name,note\r\n"Smith, John","He said ""hi""\nthen left"');
  });

  it('applies column descriptors (label + format)', () => {
    const out = toCsv(
      [{ count: 7 }],
      [{ key: 'count', label: 'total_count', format: (n) => `n=${n}` }],
    );
    expect(out).toBe('total_count\r\nn=7');
  });

  it('emits empty cells for null and undefined values', () => {
    const out = toCsv([{ a: null, b: undefined, c: 0 }], ['a', 'b', 'c']);
    expect(out).toBe('a,b,c\r\n,,0');
  });
});
