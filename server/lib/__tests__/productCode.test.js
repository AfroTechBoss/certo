import { describe, it, expect } from 'vitest';
import { pickNextCode } from '../productCode.js';

describe('pickNextCode', () => {
  it('returns 10000 when no codes are in use', () => {
    expect(pickNextCode([])).toBe(10000);
  });

  it('returns 10000 even with null/undefined input', () => {
    expect(pickNextCode(null)).toBe(10000);
    expect(pickNextCode(undefined)).toBe(10000);
  });

  it('returns the next sequential code when codes are contiguous from the start', () => {
    expect(pickNextCode([10000, 10001, 10002])).toBe(10003);
  });

  it('fills the lowest gap, not the next-after-max (so deleted codes get reused)', () => {
    // Scenario: 10000, 10001, 10003 are in use (10002 was deleted).
    // Next new product should claim 10002, NOT 10004.
    expect(pickNextCode([10000, 10001, 10003])).toBe(10002);
  });

  it('reuses codes from deleted products even if the gap is at the start', () => {
    // 10001 and 10002 are in use, 10000 was deleted — next code should be 10000.
    expect(pickNextCode([10001, 10002])).toBe(10000);
  });

  it('accepts string codes from the DB and converts them', () => {
    // Postgres returns INTEGER as a number, but other drivers sometimes return
    // strings. The picker should normalise so this can't bite us silently.
    expect(pickNextCode(['10000', '10001', 10003])).toBe(10002);
  });

  it('handles unsorted input correctly (algorithm is order-independent)', () => {
    expect(pickNextCode([10005, 10000, 10003, 10001])).toBe(10002);
  });

  it('throws when the entire 5-digit space is exhausted', () => {
    const allCodes = [];
    for (let c = 10000; c <= 99999; c++) allCodes.push(c);
    expect(() => pickNextCode(allCodes)).toThrow(/No available/i);
  });
});
