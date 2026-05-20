import { describe, it, expect } from 'vitest';
import { money, units, hexA } from './format';

describe('money', () => {
  it('formats zero', () => {
    expect(money(0)).toBe('$0');
  });
  it('formats small integers', () => {
    expect(money(500)).toBe('$500');
  });
  it('formats thousands with K', () => {
    expect(money(15000)).toBe('$15.0K');
  });
  it('formats millions with M', () => {
    expect(money(2500000)).toBe('$2.50M');
  });
  it('formats billions with B', () => {
    expect(money(3000000000)).toBe('$3.00B');
  });
  it('formats trillions with T', () => {
    expect(money(4000000000000)).toBe('$4.00T');
  });
  it('clamps negative values to $0', () => {
    expect(money(-100)).toBe('$0');
  });
  it('handles non-finite values', () => {
    expect(money(Infinity)).toBe('$0');
    expect(money(NaN)).toBe('$0');
  });
});

describe('units', () => {
  it('formats zero', () => {
    expect(units(0)).toBe('0');
  });
  it('formats below threshold', () => {
    expect(units(999)).toBe('999');
  });
  it('formats thousands with K', () => {
    expect(units(1500)).toBe('1.5K');
  });
  it('formats millions with M', () => {
    expect(units(2000000)).toBe('2.0M');
  });
});

describe('hexA', () => {
  it('converts black to rgba', () => {
    expect(hexA('#000000', 1)).toBe('rgba(0,0,0,1)');
  });
  it('converts white to rgba', () => {
    expect(hexA('#ffffff', 0.5)).toBe('rgba(255,255,255,0.5)');
  });
  it('converts neon cyan to rgba', () => {
    expect(hexA('#38f8ff', 1)).toBe('rgba(56,248,255,1)');
  });
});
