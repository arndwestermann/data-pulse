import { WritableSignal, inject, signal, effect, untracked, DestroyRef } from '@angular/core';
import { CacheService } from '../../services';
import { deepDifference } from '../deep-difference/deep-difference.util';

export type CacheType<T, TOperator = T> = TOperator extends T | null ? T : T | null;

export function fromCache<T>(key: string): WritableSignal<T | null>;
export function fromCache<T>(key: string, defaultValue: T): WritableSignal<T>;

// Kudos to https://dev.to/this-is-angular/synchronized-web-storage-with-signals-5b05
export function fromCache<T>(key: string, defaultValue: T | null = null): WritableSignal<T | null> | WritableSignal<T> {
	const cache = inject(CacheService);

	const initialValue = cache.getItem<T>(key);

	const fromCacheSignal = defaultValue !== null ? signal<T>(initialValue ?? defaultValue) : signal<T | null>(initialValue ?? defaultValue);

	effect(() => {
		const updated = fromCacheSignal();

		untracked(() => cache.setItem(key, updated));
	});

	const cacheEventListener = (event: StorageEvent) => {
		const isWatchedValueTargeted = event.key === key;
		if (!isWatchedValueTargeted) return;

		const currentValue = fromCacheSignal();
		const newValue = cache.getItem<T>(key);

		const isObject = typeof newValue === 'object' && typeof currentValue === 'object';
		let valueChanged = false;

		if (isObject) {
			const diff = deepDifference(currentValue ?? {}, newValue ?? {});
			valueChanged = diff.isDifferent;
		} else {
			valueChanged = currentValue !== newValue;
		}

		if (valueChanged) {
			fromCacheSignal.set(newValue);
		}
	};

	window.addEventListener('storage', cacheEventListener);

	inject(DestroyRef).onDestroy(() => {
		window.removeEventListener('storage', cacheEventListener);
	});

	return fromCacheSignal;
}
