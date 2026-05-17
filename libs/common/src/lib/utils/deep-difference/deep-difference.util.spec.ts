import { ObjectDiff } from '../../models/object-diff.model';
import { deepDifference, deepDifferenceArray } from './deep-difference.util';

describe('deepDifference', () => {
	it('should detect unchanged values', () => {
		const oldObj = { a: 1 };
		const newObj = { a: 1 };

		const diff = deepDifference(oldObj, newObj);
		expect(diff.isDifferent).toBe(false);
		expect(diff.unchanged).toEqual({ a: 1 });
	});

	it('should detect updated values', () => {
		const oldObj = { a: 1 };
		const newObj = { a: 2 };

		const diff = deepDifference(oldObj, newObj);
		expect(diff.isDifferent).toBe(true);
		expect(diff.updated['a']).toEqual({ oldValue: 1, newValue: 2 });
	});

	it('should detect added values', () => {
		const oldObj = { a: 1 };
		const newObj = { a: 1, b: 2 };

		const diff = deepDifference(oldObj, newObj);
		expect(diff.isDifferent).toBe(true);
		expect(diff.added).toEqual({ b: 2 });
	});

	it('should detect removed values', () => {
		const oldObj = { a: 1, b: 2 };
		const newObj = { a: 1 };

		const diff = deepDifference(oldObj, newObj);
		expect(diff.isDifferent).toBe(true);
		expect(diff.removed).toEqual({ b: 2 });
	});

	it('should handle nested objects', () => {
		const oldObj = { a: { x: 1 } };
		const newObj = { a: { x: 2 } };

		const diff = deepDifference(oldObj, newObj);
		expect(diff.isDifferent).toBe(true);
		expect((diff.updated['a'] as ObjectDiff).updated['x']).toEqual({ oldValue: 1, newValue: 2 });
	});

	it('should handle arrays inside objects', () => {
		const oldObj = { a: [1, 2, 3] };
		const newObj = { a: [1, 4, 3] };

		const diff = deepDifference(oldObj, newObj);
		expect(diff.isDifferent).toBe(true);
		const nested = diff.updated['a'] as ObjectDiff;
		expect(nested.updated).toHaveProperty('1'); // index 1 updated
	});

	it('should detect unchanged dates', () => {
		const d1 = new Date('2020-01-01');
		const d2 = new Date('2020-01-01');
		const diff = deepDifference({ a: d1 }, { a: d2 });
		expect(diff.isDifferent).toBe(false);
		expect(diff.unchanged).toEqual({ a: d1 });
	});

	it('should detect updated dates', () => {
		const d1 = new Date('2020-01-01');
		const d2 = new Date('2021-01-01');
		const diff = deepDifference({ a: d1 }, { a: d2 });
		expect(diff.isDifferent).toBe(true);
		expect(diff.updated['a']).toEqual({ oldValue: d1, newValue: d2 });
	});
});

describe('deepDifferenceArray', () => {
	it('should detect unchanged arrays', () => {
		const oldArr = [1, 2, 3];
		const newArr = [1, 2, 3];
		const diff = deepDifferenceArray(oldArr, newArr);

		expect(diff.isDifferent).toBe(false);
		expect(diff.unchanged).toEqual({ 0: 1, 1: 2, 2: 3 });
	});

	it('should detect added elements', () => {
		const oldArr = [1, 2];
		const newArr = [1, 2, 3];
		const diff = deepDifferenceArray(oldArr, newArr);

		expect(diff.isDifferent).toBe(true);
		expect(diff.added).toEqual({ 2: 3 });
	});

	it('should detect removed elements', () => {
		const oldArr = [1, 2, 3];
		const newArr = [1, 2];
		const diff = deepDifferenceArray(oldArr, newArr);

		expect(diff.isDifferent).toBe(true);
		expect(diff.removed).toEqual({ 2: 3 });
	});

	it('should detect updated elements (order respected)', () => {
		const oldArr = [1, 2, 3];
		const newArr = [1, 4, 3];
		const diff = deepDifferenceArray(oldArr, newArr);

		expect(diff.isDifferent).toBe(true);
		expect(diff.updated[1]).toEqual({ oldValue: 2, newValue: 4 });
	});

	it('should detect changes ignoring order (smart match)', () => {
		const oldArr = [{ id: 1, val: 'a' }];
		const newArr = [{ id: 1, val: 'b' }];
		const diff = deepDifferenceArray(
			oldArr,
			newArr,
			true,
			false, // ignore order
			'smart',
			(item) => (item as { id: number; val: string }).id,
		);

		expect(diff.isDifferent).toBe(true);
		expect((diff.updated[0] as ObjectDiff).updated['val']).toEqual({ oldValue: 'a', newValue: 'b' });
	});

	it('should treat different objects as removed+added in strict mode', () => {
		const oldArr = [{ id: 1, val: 'a' }];
		const newArr = [{ id: 1, val: 'b' }];
		const diff = deepDifferenceArray(oldArr, newArr, true, false, 'strict');

		expect(diff.isDifferent).toBe(true);
		expect(diff.removed).toHaveProperty('0');
		expect(diff.added).toHaveProperty('0');
	});
});

describe('integration: deepDifference + deepDifferenceArray', () => {
	it('should handle nested objects with nested arrays', () => {
		const oldObj = {
			id: 1,
			name: 'Project X',
			tags: ['alpha', 'beta'],
			meta: {
				created: new Date('2020-01-01'),
				owners: [
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
				],
			},
		};

		const newObj = {
			id: 1,
			name: 'Project X updated',
			tags: ['alpha', 'gamma'], // index 1 changed -> should be "updated" in order-sensitive mode
			meta: {
				created: new Date('2020-01-01'), // unchanged
				owners: [
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bobby' },
				], // Bob -> Bobby at same index
			},
		};

		const diff = deepDifference(oldObj, newObj);

		// top-level: name changed
		expect(diff.updated.name).toEqual({ oldValue: 'Project X', newValue: 'Project X updated' });

		// tags diff (order-sensitive default) → index 1 should be "updated"
		const tagsDiff = diff.updated['tags'] as ObjectDiff;
		expect(tagsDiff.updated).toHaveProperty('1');
		expect(tagsDiff.updated[1]).toEqual({ oldValue: 'beta', newValue: 'gamma' });

		// meta.owners diff (objects at same indices) -> nested object diff at index 1
		const ownersDiff = (diff.updated.meta as ObjectDiff).updated.owners as ObjectDiff;
		expect((ownersDiff.updated[1] as ObjectDiff).updated.name).toEqual({
			oldValue: 'Bob',
			newValue: 'Bobby',
		});

		// meta.created unchanged — compare time to avoid reference issues
		const metaDiff = diff.updated.meta as ObjectDiff;
		expect((metaDiff.unchanged as any).created.getTime()).toBe(new Date('2020-01-01').getTime());
	});
});
