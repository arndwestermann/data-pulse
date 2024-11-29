import { TestBed } from '@angular/core/testing';

import { CacheService, STORAGE_TOKEN } from './cache.service';

describe('CacheService', () => {
	let service: CacheService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [{ provide: STORAGE_TOKEN, useValue: localStorage }],
		});
		service = TestBed.inject(CacheService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
