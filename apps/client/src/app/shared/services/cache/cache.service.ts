import { Injectable, inject, InjectionToken } from '@angular/core';
import { restoreDates } from '../../utils';
import { Observable, of } from 'rxjs';

export const STORAGE_TOKEN = new InjectionToken<Storage>('STORAGE_TOKEN');

@Injectable({
	providedIn: 'root',
})
export class CacheService {
	private readonly storage = inject(STORAGE_TOKEN);

	public getItem<T>(key: string): T | null {
		const raw = this.storage.getItem(key);
		if (raw) {
			let parsed: T | null = null;
			try {
				parsed = JSON.parse(raw) as T;
			} catch {
				parsed = raw as T;
			}

			return restoreDates(parsed) as T;
		}
		return null;
	}

	public setItem<T>(key: string, value: T | null): void {
		const isString = typeof value === 'string';
		const newValue = isString ? value : JSON.stringify(value);
		this.storage.setItem(key, newValue);

		const storageEvent = new StorageEvent('storage', {
			key,
			newValue,
			storageArea: this.storage,
		});

		window.dispatchEvent(storageEvent);
	}

	public load<T>(key: string): Observable<T | null> {
		return of(this.getItem<T>(key));
	}

	public save<T>(key: string, data: T): Observable<T> {
		this.setItem(key, data);

		return of(data);
	}
}
