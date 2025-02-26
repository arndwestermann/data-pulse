import { deepDifference } from './deep-difference.util';
import { DeepDiff } from '../../models';

describe('deepDifference', () => {
	const sut = deepDifference;

	it('should be same object', () => {
		const creation_date = new Date('2024-07-02T12:56:52.000Z');
		const oldValue = {
			uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			hash: 'd8263f369492ad6e6205ddb10496ab88',
			version: 1,
			endeavour: '1',
			name: 'The Purge.pdf',
			size: 55087,
			mimetype: 'application/pdf',
			path: 'some/path/to/file_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'some-type',
			creation_date,
		};

		const newValue = {
			uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			hash: 'd8263f369492ad6e6205ddb10496ab88',
			version: 1,
			endeavour: '1',
			name: 'The Purge.pdf',
			size: 55087,
			mimetype: 'application/pdf',
			path: 'some/path/to/file_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'some-type',
			creation_date,
		};

		const expected: DeepDiff = {
			added: {},
			updated: {},
			removed: {},
			unchanged: {
				uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				hash: 'd8263f369492ad6e6205ddb10496ab88',
				version: 1,
				endeavour: '1',
				name: 'The Purge.pdf',
				size: 55087,
				mimetype: 'application/pdf',
				path: 'some/path/to/file_6683f914633644_30491395.pdf',
				thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
				content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
				collection: 'default',
				type: 'some-type',
				creation_date,
			},
			isDifferent: false,
		};
		expect(sut(oldValue, newValue)).toMatchObject(expected);
	});

	it('should be different object', () => {
		const creation_date = new Date('2024-07-02T12:56:52.000Z');
		const oldValue = {
			uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			hash: 'd8263f369492ad6e6205ddb10496ab88',
			version: 1,
			endeavour: '1',
			name: 'The Purge.pdf',
			size: 55087,
			mimetype: 'application/pdf',
			path: 'some/path/to/file_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'some-type',
			creation_date,
		};

		const newValue = {
			uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			hash: 'd8263f369492ad6e6205ddb10496ab88',
			version: 1,
			endeavour: '1',
			name: 'The Purge.pdf',
			size: 55087,
			mimetype: 'application/pdf',
			path: 'some/path/to/file_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'some-other-type',
			creation_date,
		};

		const expected: DeepDiff = {
			added: {},
			updated: { type: { oldValue: 'some-type', newValue: 'some-other-type' } },
			removed: {},
			unchanged: {
				uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				hash: 'd8263f369492ad6e6205ddb10496ab88',
				version: 1,
				endeavour: '1',
				name: 'The Purge.pdf',
				size: 55087,
				mimetype: 'application/pdf',
				path: 'some/path/to/file_6683f914633644_30491395.pdf',
				thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
				content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
				collection: 'default',
				creation_date,
			},
			isDifferent: true,
		};
		expect(sut(oldValue, newValue)).toMatchObject(expected);
	});

	it('should be same if the dates are the same', () => {
		const oldValue = {
			creation_date: new Date('1995-07-14T12:56:52.000Z'),
		};

		const newValue = {
			creation_date: new Date('1995-07-14T12:56:52.000Z'),
		};

		const expected = {
			added: {},
			updated: {},
			removed: {},
			unchanged: {
				creation_date: new Date('1995-07-14T12:56:52.000Z'),
			},
			isDifferent: false,
		};

		expect(sut(oldValue, newValue)).toMatchObject(expected);
	});

	it('should be different if the dates are different', () => {
		const oldValue = {
			creation_date: new Date('1995-07-14T12:56:52.000Z'),
		};

		const newValue = {
			creation_date: new Date('1995-07-14T12:56:53.000Z'),
		};

		const expected = {
			added: {},
			updated: {
				creation_date: {
					oldValue: new Date('1995-07-14T12:56:52.000Z'),
					newValue: new Date('1995-07-14T12:56:53.000Z'),
				},
			},
			removed: {},
			unchanged: {},
			isDifferent: true,
		};

		expect(sut(oldValue, newValue)).toMatchObject(expected);
	});

	it('should be same if the arrays are same', () => {
		const oldValue = {
			arr1: [
				{ name: 'a', age: 42 },
				{ name: 'b', age: 1337 },
			],
		};

		const newValue = {
			arr1: [
				{ name: 'a', age: 42 },
				{ name: 'b', age: 1337 },
			],
		};

		const expected: DeepDiff = {
			added: {},
			updated: {},
			removed: {},
			unchanged: {
				arr1: [
					{ name: 'a', age: 42 },
					{ name: 'b', age: 1337 },
				],
			},
			isDifferent: false,
		};

		expect(sut(oldValue, newValue)).toMatchObject(expected);
	});

	it('should be different if the arrays are different', () => {
		const oldValue = {
			arr1: [
				{ name: 'a', age: 42 },
				{ name: 'b', age: 1337 },
			],
		};

		const newValue = {
			arr1: [
				{ name: 'a', age: 69 },
				{ name: 'b', age: 42 },
			],
		};

		const expected: DeepDiff = {
			added: {},
			updated: {
				arr1: {
					added: {},
					updated: {
						'0': {
							added: {},
							updated: {
								age: {
									oldValue: 42,
									newValue: 69,
								},
							},
							removed: {},
							unchanged: {
								name: 'a',
							},
							isDifferent: true,
						},
						'1': {
							added: {},
							updated: {
								age: {
									oldValue: 1337,
									newValue: 42,
								},
							},
							removed: {},
							unchanged: {
								name: 'b',
							},
							isDifferent: true,
						},
					},
					removed: {},
					unchanged: {},
					isDifferent: true,
				},
			},
			removed: {},
			unchanged: {},
			isDifferent: true,
		};

		expect(sut(oldValue, newValue)).toMatchObject(expected);
	});
});
