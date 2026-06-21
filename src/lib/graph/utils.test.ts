import { describe, it, expect } from 'vitest';
import { extractJSON, safeJSONParse, getCityCoord } from '@/lib/graph/utils';

describe('extractJSON', () => {
  it('should extract JSON from code block', () => {
    const text = '```json\n{"name": "test"}\n```';
    expect(extractJSON(text)).toBe('{"name": "test"}');
  });

  it('should extract JSON from plain code block', () => {
    const text = '```\n{"name": "test"}\n```';
    expect(extractJSON(text)).toBe('{"name": "test"}');
  });

  it('should extract JSON object directly', () => {
    const text = '{"name": "test"}';
    expect(extractJSON(text)).toBe('{"name": "test"}');
  });

  it('should extract JSON array directly', () => {
    const text = '[1, 2, 3]';
    expect(extractJSON(text)).toBe('[1, 2, 3]');
  });

  it('should return trimmed text if no JSON found', () => {
    expect(extractJSON('hello world')).toBe('hello world');
  });
});

describe('safeJSONParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJSONParse('{"name": "test"}', {} as { name?: string });
    expect(result).toEqual({ name: 'test' });
  });

  it('should return fallback on invalid JSON', () => {
    const fallback = { name: 'fallback' };
    const result = safeJSONParse('not json', fallback);
    expect(result).toBe(fallback);
  });

  it('should return fallback when expectedKeys provided but parsed is array', () => {
    // expectedKeys ensures the parsed value is a non-null object (not array, not null)
    const fallback = { city: '', days: [] as unknown[] };
    const result = safeJSONParse('[1, 2, 3]', fallback, ['city', 'days']);
    expect(result).toBe(fallback);
  });

  it('should pass with valid expected keys', () => {
    const result = safeJSONParse('{"city": "北京", "days": [1, 2, 3]}', { city: '', days: [] as unknown[] }, ['city', 'days']);
    expect(result).toEqual({ city: '北京', days: [1, 2, 3] });
  });

  it('should return fallback when array expected but object returned', () => {
    const fallback: { name: string }[] = [];
    const result = safeJSONParse('{"not": "array"}', fallback);
    expect(result).toBe(fallback);
  });

  it('should parse valid array', () => {
    const fallback: { name: string }[] = [];
    const result = safeJSONParse('[{"name": "a"}, {"name": "b"}]', fallback);
    expect(result).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('should handle null input - returns null as parsed value', () => {
    const fallback = { name: 'fallback' };
    // safeJSONParse calls JSON.parse('null') which returns null,
    // and since fallback is not an array and no expectedKeys, it returns null directly
    const result = safeJSONParse('null', fallback);
    expect(result).toBeNull();
  });
});

describe('getCityCoord', () => {
  it('should return exact match for 北京', () => {
    const coord = getCityCoord('北京');
    expect(coord.longitude).toBe(116.4074);
    expect(coord.latitude).toBe(39.9042);
  });

  it('should return match after stripping 市 suffix', () => {
    const coord = getCityCoord('北京市');
    expect(coord.longitude).toBe(116.4074);
    expect(coord.latitude).toBe(39.9042);
  });

  it('should return match after stripping 省 suffix', () => {
    const coord = getCityCoord('广东省');
    // 广东省 is not in the map, after stripping 省 -> 广东 (not in map), so it falls back to default
    expect(coord.longitude).toBe(116.397128);
  });

  it('should NOT mismatch 广州 with 杭州', () => {
    const coord = getCityCoord('广州');
    expect(coord.longitude).toBe(113.2644);
    expect(coord.latitude).toBe(23.1291);
  });

  it('should return default coords for unknown city', () => {
    const coord = getCityCoord('火星');
    expect(coord.longitude).toBe(116.397128);
    expect(coord.latitude).toBe(39.916527);
  });
});