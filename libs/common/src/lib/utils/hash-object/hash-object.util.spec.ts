import { describe, it, expect } from 'vitest';
import { hashObject } from './hash-object.util'; // adjust path

describe('djb2Hash (via hashObject)', () => {
	it('same string → same hash', () => {
		const a = hashObject({ x: 1 });
		const b = hashObject({ x: 1 });
		expect(a).toBe(b);
	});

	it('returns hex string', () => {
		expect(hashObject('hello')).toMatch(/^[0-9a-f]+$/);
	});

	it('empty object', () => {
		expect(hashObject({})).toBeTruthy();
	});

	it('null input', () => {
		expect(hashObject(null)).toBeTruthy();
	});
});

describe('hashObject — key ordering', () => {
	it('same keys different order → same hash', () => {
		const a = hashObject({ a: 1, b: 2 });
		const b = hashObject({ b: 2, a: 1 });
		expect(a).toBe(b);
	});

	it('nested obj key order normalized', () => {
		const a = hashObject({ x: { a: 1, b: 2 } });
		const b = hashObject({ x: { b: 2, a: 1 } });
		expect(a).toBe(b);
	});

	it('different values → different hash', () => {
		expect(hashObject({ a: 1 })).not.toBe(hashObject({ a: 2 }));
	});

	it('different keys → different hash', () => {
		expect(hashObject({ a: 1 })).not.toBe(hashObject({ b: 1 }));
	});
});

describe('hashObject — type handling', () => {
	it('array preserves order (no sort)', () => {
		const a = hashObject([1, 2, 3]);
		const b = hashObject([3, 2, 1]);
		expect(a).not.toBe(b);
	});

	it('array same order → same hash', () => {
		expect(hashObject([1, 2])).toBe(hashObject([1, 2]));
	});

	it('string input', () => {
		expect(hashObject('foo')).toBe(hashObject('foo'));
		expect(hashObject('foo')).not.toBe(hashObject('bar'));
	});

	it('number input', () => {
		expect(hashObject(42)).toBe(hashObject(42));
		expect(hashObject(42)).not.toBe(hashObject(43));
	});

	it('boolean input', () => {
		expect(hashObject(true)).not.toBe(hashObject(false));
	});

	it('undefined input throws', () => {
		expect(() => hashObject(undefined)).toThrow(TypeError);
	});
});

describe('hashObject — deep nesting', () => {
	it('deep equal nested → same hash', () => {
		const a = hashObject({ a: { b: { c: 1 } } });
		const b = hashObject({ a: { b: { c: 1 } } });
		expect(a).toBe(b);
	});

	it('deep nested key order normalized', () => {
		const a = hashObject({ z: { b: 2, a: 1 }, a: { y: 9, x: 8 } });
		const b = hashObject({ a: { x: 8, y: 9 }, z: { a: 1, b: 2 } });
		expect(a).toBe(b);
	});
});
