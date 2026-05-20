import { describe, it, expect } from 'vitest';
import { clamp, lerp, rand, len, d2, dist } from './math';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it('handles equal min/max', () => {
    expect(clamp(7, 5, 5)).toBe(5);
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });
  it('returns b at t=1', () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });
  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

describe('rand', () => {
  it('stays within [a, b]', () => {
    for (let i = 0; i < 100; i++) {
      const v = rand(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThan(9);
    }
  });
});

describe('len', () => {
  it('returns 0 for origin', () => {
    expect(len(0, 0)).toBe(0);
  });
  it('computes hypotenuse', () => {
    expect(len(3, 4)).toBe(5);
  });
});

describe('d2', () => {
  it('returns 0 for same point', () => {
    expect(d2(2, 3, 2, 3)).toBe(0);
  });
  it('returns squared distance', () => {
    expect(d2(0, 0, 3, 4)).toBe(25);
  });
});

describe('dist', () => {
  it('returns 0 for same point', () => {
    expect(dist(1, 1, 1, 1)).toBe(0);
  });
  it('returns euclidean distance', () => {
    expect(dist(0, 0, 3, 4)).toBe(5);
  });
});
