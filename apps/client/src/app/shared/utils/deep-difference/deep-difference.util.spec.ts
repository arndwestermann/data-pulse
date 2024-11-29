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
			path: 'some/path/to/endeavour_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'print_image',
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
			path: 'some/path/to/endeavour_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'print_image',
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
				path: 'some/path/to/endeavour_6683f914633644_30491395.pdf',
				thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
				content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
				collection: 'default',
				type: 'print_image',
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
			path: 'some/path/to/endeavour_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'print_image',
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
			path: 'some/path/to/endeavour_6683f914633644_30491395.pdf',
			thumbnail_path: 'some/path/to/preview_6683f914633644_30491395.jpg',
			content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
			collection: 'default',
			type: 'invoice',
			creation_date,
		};

		const expected: DeepDiff = {
			added: {},
			updated: { type: { oldValue: 'print_image', newValue: 'invoice' } },
			removed: {},
			unchanged: {
				uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				hash: 'd8263f369492ad6e6205ddb10496ab88',
				version: 1,
				endeavour: '1',
				name: 'The Purge.pdf',
				size: 55087,
				mimetype: 'application/pdf',
				path: 'some/path/to/endeavour_6683f914633644_30491395.pdf',
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

	it('should be same for endeavour item', () => {
		const oldValue = {
			title: 'Hello, World!',
			order_number: '1',
			is_archived: false,
			form_name: 'order',
			thumbnail: {
				uuid: '87b245d8-d808-4af2-9c32-7154bf00b659',
				hash: 'd8263f369492ad6e6205ddb10496ab88',
				version: 1,
				endeavour: '1',
				name: 'The Purge.pdf',
				size: 55087,
				mimetype: 'application/pdf',
				path: '/media/samba/files/000/0000/1/endeavour_6683f914633644_30491395.pdf',
				thumbnail_path: 'data/upload/previews/000/0000/1/preview_6683f914633644_30491395.jpg',
				content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
				collection: 'default',
				type: 'invoice',
				creation_date: new Date('2024-07-02T12:56:52.000Z'),
			},
			field_values: {
				delivery_address: '8feee0a0-3e01-4d85-b720-a14e3fa88275',
				payment_method: 'invoice',
				plate_substrate: 'cardboard_preprint',
				plate: [{ plate_thickness_plate: '1.14', resolution_plate: '2400' }],
				preflight_requested: 'no',
				product: 'plate',
			},
			meta: {
				endeavour: '1',
				creator: {
					uuid: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
					username: 'arnd',
					email_address: 'arnd.westerman@precess.de',
					is_deleted: false,
					is_blocked: false,
					is_superuser: true,
					avatar_path: null,
					in_control_of: null,
					group_name: 'user',
					meta: {
						user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						activation_date: null,
						activation_sent_date: new Date('2024-06-03T11:17:53.000Z'),
						last_login_date: new Date('2024-07-12T11:54:47.000Z'),
						last_activity_date: new Date('2024-07-12T11:54:47.000Z'),
					},
					contact: {
						user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						staff_number: null,
						office: null,
						gender: 'Male',
						first_name: 'Arnd',
						last_name: 'Westermann',
						phone_number: '0123456789',
						mobile_phone_number: '0123456789',
						company: 'Precess GmbH',
					},
					classifications: [],
					config: {
						user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						locale: 'en-GB',
						privacy_accept_date: null,
						has_privacy_accepted: false,
						terms_and_conditions: { user: null, is_accepted: false, accept_date: null },
					},
					current_tenant: { slug: 'default', title: 'Default', url: null, is_default: true, is_in_maintenance_mode: false },
					valid_tenants: [
						{ slug: 'amira', title: 'amira', url: 'amira_url', is_default: false, is_in_maintenance_mode: false, disabled: false },
						{ slug: 'default', title: 'Default', url: null, is_default: true, is_in_maintenance_mode: false, disabled: false },
						{ slug: 'global', title: 'Global', url: null, is_default: false, is_in_maintenance_mode: false, disabled: false },
						{ slug: 'rafael', title: 'Rafael', url: 'Rafael_url', is_default: false, is_in_maintenance_mode: false, disabled: false },
					],
					addressBook: [
						{
							uuid: '5b88dd6d-2598-4e42-b06a-2463030a59bb',
							addressee: '1',
							street: '1',
							house_number: '1',
							additional_address: '1',
							postal_code: '1',
							city: '1',
							country: 'AFG',
							is_default: false,
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						},
						{
							uuid: '8feee0a0-3e01-4d85-b720-a14e3fa88275',
							addressee: 'Tony Stark',
							street: 'Street and Broadway',
							house_number: '59th',
							additional_address: 'Manhattan',
							postal_code: '10001',
							city: 'New York, NY',
							country: 'USA',
							is_default: true,
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						},
						{
							uuid: 'e75c228e-3541-4deb-992c-262d42b30391',
							addressee: 'Clark Kent',
							street: 'Clinton St',
							house_number: '344',
							additional_address: 'Apt 3B',
							postal_code: '10048',
							city: 'Metropolis, NY',
							country: 'USA',
							is_default: false,
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						},
					],
					permissions: 'all',
					nav: [
						{
							category: 'Navigation',
							isVisible: true,
							items: [
								{
									id: 'newOrder',
									text: 'New Order',
									icon: 'fa-solid fa-pencil',
									iconColor: '#45A4F2',
									route: '/orders/new',
									subMenu: [],
									isVisible: true,
								},
								{
									id: 'orders',
									text: 'Order',
									icon: 'fa-regular fa-file-lines',
									iconColor: '#F35C55',
									route: '/orders',
									subMenu: [],
									isVisible: true,
								},
							],
						},
						{
							category: 'Administration',
							isVisible: true,
							items: [
								{
									id: 'settings',
									text: 'Tenant Settings',
									icon: 'fa-solid fa-gears',
									iconColor: '#9CA3AF',
									route: '/settings',
									subMenu: [],
									isVisible: true,
								},
							],
						},
					],
					widgets: [
						{ id: 'lyiiza0atdzbcxwjrz', type: 'tenant_widget', slug: 'amira', cols: 14, rows: 23, y: 0, x: 0 },
						{ id: 'lyiiza0ajiwopqk8hh', type: 'tenant_widget', slug: 'default', cols: 14, rows: 23, y: 0, x: 14 },
						{ id: 'lyiiza0atf8d7vj8bh', type: 'tenant_widget', slug: 'global', cols: 14, rows: 23, y: 0, x: 28 },
						{ id: 'lyiiza0aofebmsqfqw', type: 'tenant_widget', slug: 'rafael', cols: 14, rows: 23, y: 0, x: 42 },
						{ id: 'lyiiza0autpef39nczf', type: 'user_widget', slug: '', cols: 14, rows: 23, y: 0, x: 56 },
					],
				},
				creation_date: new Date('2024-07-01T14:46:03.000Z'),
				last_modification_date: new Date('2024-07-05T14:02:31.000Z'),
				last_modifier: {
					uuid: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
					username: 'admin',
					email_address: 'admin@xavior.dev',
					is_deleted: false,
					is_blocked: false,
					is_superuser: true,
					avatar_path: null,
					in_control_of: null,
					group_name: 'user',
					meta: {
						user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						activation_date: null,
						activation_sent_date: null,
						last_login_date: new Date('2024-07-08T15:02:30.000Z'),
						last_activity_date: new Date('2024-07-08T15:02:47.000Z'),
					},
					contact: {
						user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						staff_number: null,
						office: null,
						gender: 'unspecified',
						first_name: 'Ad',
						last_name: 'Min',
						phone_number: null,
						mobile_phone_number: null,
						company: 'Precess GmbH',
					},
					classifications: [],
					config: {
						user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						locale: 'de-DE',
						privacy_accept_date: new Date('2024-05-29T08:44:48.000Z'),
						has_privacy_accepted: true,
						terms_and_conditions: { user: null, is_accepted: false, accept_date: null },
					},
					current_tenant: { slug: 'global', title: 'Global', url: null, is_default: false, is_in_maintenance_mode: false },
					valid_tenants: [
						{ slug: 'amira', title: 'amira', url: 'amira_url', is_default: false, is_in_maintenance_mode: false },
						{ slug: 'default', title: 'Default', url: null, is_default: true, is_in_maintenance_mode: false },
						{ slug: 'global', title: 'Global', url: null, is_default: false, is_in_maintenance_mode: false },
						{ slug: 'rafael', title: 'Rafael', url: 'Rafael_url', is_default: false, is_in_maintenance_mode: false },
					],
				},
			},
			file_storage: { is_readonly: false, path_config: '/000/0000/1' },
			workflow_state: 'order_create',
			files: [
				{
					uuid: '87b245d8-d808-4af2-9c32-7154bf00b659',
					hash: 'd8263f369492ad6e6205ddb10496ab88',
					version: 1,
					endeavour: '1',
					name: 'The Purge.pdf',
					size: 55087,
					mimetype: 'application/pdf',
					path: '/media/samba/files/000/0000/1/endeavour_6683f914633644_30491395.pdf',
					thumbnail_path: 'data/upload/previews/000/0000/1/preview_6683f914633644_30491395.jpg',
					content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
					collection: 'default',
					type: 'invoice',
					creation_date: new Date('2024-07-02T12:56:52.000Z'),
				},
			],
		};

		const newValue = {
			title: 'Hello, World!',
			order_number: '1',
			is_archived: false,
			form_name: 'order',
			thumbnail: {
				uuid: '87b245d8-d808-4af2-9c32-7154bf00b659',
				hash: 'd8263f369492ad6e6205ddb10496ab88',
				version: 1,
				endeavour: '1',
				name: 'The Purge.pdf',
				size: 55087,
				mimetype: 'application/pdf',
				path: '/media/samba/files/000/0000/1/endeavour_6683f914633644_30491395.pdf',
				thumbnail_path: 'data/upload/previews/000/0000/1/preview_6683f914633644_30491395.jpg',
				content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
				collection: 'default',
				type: 'invoice',
				creation_date: new Date('2024-07-02T12:56:52.000Z'),
			},
			field_values: {
				delivery_address: '8feee0a0-3e01-4d85-b720-a14e3fa88275',
				payment_method: 'invoice',
				plate_substrate: 'cardboard_preprint',
				plate: [{ plate_thickness_plate: '1.14', resolution_plate: '2400' }],
				preflight_requested: 'no',
				product: 'plate',
			},
			meta: {
				endeavour: '1',
				creator: {
					uuid: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
					username: 'arnd',
					email_address: 'arnd.westerman@precess.de',
					is_deleted: false,
					is_blocked: false,
					is_superuser: true,
					avatar_path: null,
					in_control_of: null,
					group_name: 'user',
					meta: {
						user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						activation_date: null,
						activation_sent_date: new Date('2024-06-03T11:17:53.000Z'),
						last_login_date: new Date('2024-07-12T11:54:47.000Z'),
						last_activity_date: new Date('2024-07-12T11:54:47.000Z'),
					},
					contact: {
						user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						staff_number: null,
						office: null,
						gender: 'Male',
						first_name: 'Arnd',
						last_name: 'Westermann',
						phone_number: '0123456789',
						mobile_phone_number: '0123456789',
						company: 'Precess GmbH',
					},
					classifications: [],
					config: {
						user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						locale: 'en-GB',
						privacy_accept_date: null,
						has_privacy_accepted: false,
						terms_and_conditions: { user: null, is_accepted: false, accept_date: null },
					},
					current_tenant: { slug: 'default', title: 'Default', url: null, is_default: true, is_in_maintenance_mode: false },
					valid_tenants: [
						{ slug: 'amira', title: 'amira', url: 'amira_url', is_default: false, is_in_maintenance_mode: false, disabled: false },
						{ slug: 'default', title: 'Default', url: null, is_default: true, is_in_maintenance_mode: false, disabled: false },
						{ slug: 'global', title: 'Global', url: null, is_default: false, is_in_maintenance_mode: false, disabled: false },
						{ slug: 'rafael', title: 'Rafael', url: 'Rafael_url', is_default: false, is_in_maintenance_mode: false, disabled: false },
					],
					addressBook: [
						{
							uuid: '5b88dd6d-2598-4e42-b06a-2463030a59bb',
							addressee: '1',
							street: '1',
							house_number: '1',
							additional_address: '1',
							postal_code: '1',
							city: '1',
							country: 'AFG',
							is_default: false,
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						},
						{
							uuid: '8feee0a0-3e01-4d85-b720-a14e3fa88275',
							addressee: 'Tony Stark',
							street: 'Street and Broadway',
							house_number: '59th',
							additional_address: 'Manhattan',
							postal_code: '10001',
							city: 'New York, NY',
							country: 'USA',
							is_default: true,
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						},
						{
							uuid: 'e75c228e-3541-4deb-992c-262d42b30391',
							addressee: 'Clark Kent',
							street: 'Clinton St',
							house_number: '344',
							additional_address: 'Apt 3B',
							postal_code: '10048',
							city: 'Metropolis, NY',
							country: 'USA',
							is_default: false,
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						},
					],
					permissions: 'all',
					nav: [
						{
							category: 'Navigation',
							isVisible: true,
							items: [
								{
									id: 'newOrder',
									text: 'New Order',
									icon: 'fa-solid fa-pencil',
									iconColor: '#45A4F2',
									route: '/orders/new',
									subMenu: [],
									isVisible: true,
								},
								{
									id: 'orders',
									text: 'Order',
									icon: 'fa-regular fa-file-lines',
									iconColor: '#F35C55',
									route: '/orders',
									subMenu: [],
									isVisible: true,
								},
							],
						},
						{
							category: 'Administration',
							isVisible: true,
							items: [
								{
									id: 'settings',
									text: 'Tenant Settings',
									icon: 'fa-solid fa-gears',
									iconColor: '#9CA3AF',
									route: '/settings',
									subMenu: [],
									isVisible: true,
								},
							],
						},
					],
					widgets: [
						{ id: 'lyiiza0atdzbcxwjrz', type: 'tenant_widget', slug: 'amira', cols: 14, rows: 23, y: 0, x: 0 },
						{ id: 'lyiiza0ajiwopqk8hh', type: 'tenant_widget', slug: 'default', cols: 14, rows: 23, y: 0, x: 14 },
						{ id: 'lyiiza0atf8d7vj8bh', type: 'tenant_widget', slug: 'global', cols: 14, rows: 23, y: 0, x: 28 },
						{ id: 'lyiiza0aofebmsqfqw', type: 'tenant_widget', slug: 'rafael', cols: 14, rows: 23, y: 0, x: 42 },
						{ id: 'lyiiza0autpef39nczf', type: 'user_widget', slug: '', cols: 14, rows: 23, y: 0, x: 56 },
					],
				},
				creation_date: new Date('2024-07-01T14:46:03.000Z'),
				last_modification_date: new Date('2024-07-05T14:02:31.000Z'),
				last_modifier: {
					uuid: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
					username: 'admin',
					email_address: 'admin@xavior.dev',
					is_deleted: false,
					is_blocked: false,
					is_superuser: true,
					avatar_path: null,
					in_control_of: null,
					group_name: 'user',
					meta: {
						user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						activation_date: null,
						activation_sent_date: null,
						last_login_date: new Date('2024-07-08T15:02:30.000Z'),
						last_activity_date: new Date('2024-07-08T15:02:47.000Z'),
					},
					contact: {
						user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						staff_number: null,
						office: null,
						gender: 'unspecified',
						first_name: 'Ad',
						last_name: 'Min',
						phone_number: null,
						mobile_phone_number: null,
						company: 'Precess GmbH',
					},
					classifications: [],
					config: {
						user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						locale: 'de-DE',
						privacy_accept_date: new Date('2024-05-29T08:44:48.000Z'),
						has_privacy_accepted: true,
						terms_and_conditions: { user: null, is_accepted: false, accept_date: null },
					},
					current_tenant: { slug: 'global', title: 'Global', url: null, is_default: false, is_in_maintenance_mode: false },
					valid_tenants: [
						{ slug: 'amira', title: 'amira', url: 'amira_url', is_default: false, is_in_maintenance_mode: false },
						{ slug: 'default', title: 'Default', url: null, is_default: true, is_in_maintenance_mode: false },
						{ slug: 'global', title: 'Global', url: null, is_default: false, is_in_maintenance_mode: false },
						{ slug: 'rafael', title: 'Rafael', url: 'Rafael_url', is_default: false, is_in_maintenance_mode: false },
					],
				},
			},
			file_storage: { is_readonly: false, path_config: '/000/0000/1' },
			workflow_state: 'order_create',
			files: [
				{
					uuid: '87b245d8-d808-4af2-9c32-7154bf00b659',
					hash: 'd8263f369492ad6e6205ddb10496ab88',
					version: 1,
					endeavour: '1',
					name: 'The Purge.pdf',
					size: 55087,
					mimetype: 'application/pdf',
					path: '/media/samba/files/000/0000/1/endeavour_6683f914633644_30491395.pdf',
					thumbnail_path: 'data/upload/previews/000/0000/1/preview_6683f914633644_30491395.jpg',
					content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
					collection: 'default',
					type: 'invoice',
					creation_date: new Date('2024-07-02T12:56:52.000Z'),
				},
			],
		};

		const expected = {
			added: {},
			updated: {},
			removed: {},
			unchanged: {
				title: 'Hello, World!',
				order_number: '1',
				is_archived: false,
				form_name: 'order',
				thumbnail: {
					uuid: '87b245d8-d808-4af2-9c32-7154bf00b659',
					hash: 'd8263f369492ad6e6205ddb10496ab88',
					version: 1,
					endeavour: '1',
					name: 'The Purge.pdf',
					size: 55087,
					mimetype: 'application/pdf',
					path: '/media/samba/files/000/0000/1/endeavour_6683f914633644_30491395.pdf',
					thumbnail_path: 'data/upload/previews/000/0000/1/preview_6683f914633644_30491395.jpg',
					content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
					collection: 'default',
					type: 'invoice',
					creation_date: new Date('2024-07-02T12:56:52.000Z'),
				},
				field_values: {
					delivery_address: '8feee0a0-3e01-4d85-b720-a14e3fa88275',
					payment_method: 'invoice',
					plate_substrate: 'cardboard_preprint',
					plate: [
						{
							plate_thickness_plate: '1.14',
							resolution_plate: '2400',
						},
					],
					preflight_requested: 'no',
					product: 'plate',
				},
				meta: {
					endeavour: '1',
					creator: {
						uuid: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
						username: 'arnd',
						email_address: 'arnd.westerman@precess.de',
						is_deleted: false,
						is_blocked: false,
						is_superuser: true,
						avatar_path: null,
						in_control_of: null,
						group_name: 'user',
						meta: {
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
							activation_date: null,
							activation_sent_date: new Date('2024-06-03T11:17:53.000Z'),
							last_login_date: new Date('2024-07-12T11:54:47.000Z'),
							last_activity_date: new Date('2024-07-12T11:54:47.000Z'),
						},
						contact: {
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
							staff_number: null,
							office: null,
							gender: 'Male',
							first_name: 'Arnd',
							last_name: 'Westermann',
							phone_number: '0123456789',
							mobile_phone_number: '0123456789',
							company: 'Precess GmbH',
						},
						classifications: [],
						config: {
							user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
							locale: 'en-GB',
							privacy_accept_date: null,
							has_privacy_accepted: false,
							terms_and_conditions: {
								user: null,
								is_accepted: false,
								accept_date: null,
							},
						},
						current_tenant: {
							slug: 'default',
							title: 'Default',
							url: null,
							is_default: true,
							is_in_maintenance_mode: false,
						},
						valid_tenants: [
							{
								slug: 'amira',
								title: 'amira',
								url: 'amira_url',
								is_default: false,
								is_in_maintenance_mode: false,
								disabled: false,
							},
							{
								slug: 'default',
								title: 'Default',
								url: null,
								is_default: true,
								is_in_maintenance_mode: false,
								disabled: false,
							},
							{
								slug: 'global',
								title: 'Global',
								url: null,
								is_default: false,
								is_in_maintenance_mode: false,
								disabled: false,
							},
							{
								slug: 'rafael',
								title: 'Rafael',
								url: 'Rafael_url',
								is_default: false,
								is_in_maintenance_mode: false,
								disabled: false,
							},
						],
						addressBook: [
							{
								uuid: '5b88dd6d-2598-4e42-b06a-2463030a59bb',
								addressee: '1',
								street: '1',
								house_number: '1',
								additional_address: '1',
								postal_code: '1',
								city: '1',
								country: 'AFG',
								is_default: false,
								user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
							},
							{
								uuid: '8feee0a0-3e01-4d85-b720-a14e3fa88275',
								addressee: 'Tony Stark',
								street: 'Street and Broadway',
								house_number: '59th',
								additional_address: 'Manhattan',
								postal_code: '10001',
								city: 'New York, NY',
								country: 'USA',
								is_default: true,
								user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
							},
							{
								uuid: 'e75c228e-3541-4deb-992c-262d42b30391',
								addressee: 'Clark Kent',
								street: 'Clinton St',
								house_number: '344',
								additional_address: 'Apt 3B',
								postal_code: '10048',
								city: 'Metropolis, NY',
								country: 'USA',
								is_default: false,
								user: 'cadc8734-1aea-4dcd-a92a-867ae38391ea',
							},
						],
						permissions: 'all',
						nav: [
							{
								category: 'Navigation',
								isVisible: true,
								items: [
									{
										id: 'newOrder',
										text: 'New Order',
										icon: 'fa-solid fa-pencil',
										iconColor: '#45A4F2',
										route: '/orders/new',
										subMenu: {},
										isVisible: true,
									},
									{
										id: 'orders',
										text: 'Order',
										icon: 'fa-regular fa-file-lines',
										iconColor: '#F35C55',
										route: '/orders',
										subMenu: {},
										isVisible: true,
									},
								],
							},
							{
								category: 'Administration',
								isVisible: true,
								items: [
									{
										id: 'settings',
										text: 'Tenant Settings',
										icon: 'fa-solid fa-gears',
										iconColor: '#9CA3AF',
										route: '/settings',
										subMenu: {},
										isVisible: true,
									},
								],
							},
						],
						widgets: [
							{
								id: 'lyiiza0atdzbcxwjrz',
								type: 'tenant_widget',
								slug: 'amira',
								cols: 14,
								rows: 23,
								y: 0,
								x: 0,
							},
							{
								id: 'lyiiza0ajiwopqk8hh',
								type: 'tenant_widget',
								slug: 'default',
								cols: 14,
								rows: 23,
								y: 0,
								x: 14,
							},
							{
								id: 'lyiiza0atf8d7vj8bh',
								type: 'tenant_widget',
								slug: 'global',
								cols: 14,
								rows: 23,
								y: 0,
								x: 28,
							},
							{
								id: 'lyiiza0aofebmsqfqw',
								type: 'tenant_widget',
								slug: 'rafael',
								cols: 14,
								rows: 23,
								y: 0,
								x: 42,
							},
							{
								id: 'lyiiza0autpef39nczf',
								type: 'user_widget',
								slug: '',
								cols: 14,
								rows: 23,
								y: 0,
								x: 56,
							},
						],
					},
					creation_date: new Date('2024-07-01T14:46:03.000Z'),
					last_modification_date: new Date('2024-07-05T14:02:31.000Z'),
					last_modifier: {
						uuid: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
						username: 'admin',
						email_address: 'admin@xavior.dev',
						is_deleted: false,
						is_blocked: false,
						is_superuser: true,
						avatar_path: null,
						in_control_of: null,
						group_name: 'user',
						meta: {
							user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
							activation_date: null,
							activation_sent_date: null,
							last_login_date: new Date('2024-07-08T15:02:30.000Z'),
							last_activity_date: new Date('2024-07-08T15:02:47.000Z'),
						},
						contact: {
							user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
							staff_number: null,
							office: null,
							gender: 'unspecified',
							first_name: 'Ad',
							last_name: 'Min',
							phone_number: null,
							mobile_phone_number: null,
							company: 'Precess GmbH',
						},
						classifications: [],
						config: {
							user: '14843b4c-6f7d-425b-a341-fad3e1ab2a9e',
							locale: 'de-DE',
							privacy_accept_date: new Date('2024-05-29T08:44:48.000Z'),
							has_privacy_accepted: true,
							terms_and_conditions: {
								user: null,
								is_accepted: false,
								accept_date: null,
							},
						},
						current_tenant: {
							slug: 'global',
							title: 'Global',
							url: null,
							is_default: false,
							is_in_maintenance_mode: false,
						},
						valid_tenants: [
							{
								slug: 'amira',
								title: 'amira',
								url: 'amira_url',
								is_default: false,
								is_in_maintenance_mode: false,
							},
							{
								slug: 'default',
								title: 'Default',
								url: null,
								is_default: true,
								is_in_maintenance_mode: false,
							},
							{
								slug: 'global',
								title: 'Global',
								url: null,
								is_default: false,
								is_in_maintenance_mode: false,
							},
							{
								slug: 'rafael',
								title: 'Rafael',
								url: 'Rafael_url',
								is_default: false,
								is_in_maintenance_mode: false,
							},
						],
					},
				},
				file_storage: {
					is_readonly: false,
					path_config: '/000/0000/1',
				},
				workflow_state: 'order_create',
				files: [
					{
						uuid: '87b245d8-d808-4af2-9c32-7154bf00b659',
						hash: 'd8263f369492ad6e6205ddb10496ab88',
						version: 1,
						endeavour: '1',
						name: 'The Purge.pdf',
						size: 55087,
						mimetype: 'application/pdf',
						path: '/media/samba/files/000/0000/1/endeavour_6683f914633644_30491395.pdf',
						thumbnail_path: 'data/upload/previews/000/0000/1/preview_6683f914633644_30491395.jpg',
						content_hash: 'd5c5036eaf4405a383101d2abfec1d0c',
						collection: 'default',
						type: 'invoice',
						creation_date: new Date('2024-07-02T12:56:52.000Z'),
					},
				],
			},
			isDifferent: false,
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
