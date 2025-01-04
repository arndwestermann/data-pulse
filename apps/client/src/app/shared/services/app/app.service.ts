import { Injectable } from '@angular/core';
import { debounceTime, distinctUntilChanged, shareReplay, startWith, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class AppService {
	private readonly isLoadingSubject = new Subject<boolean>();

	public readonly isLoading$ = this.isLoadingSubject.pipe(startWith(false), debounceTime(250), distinctUntilChanged(), shareReplay(1));

	public setLoading(loading: boolean): void {
		this.isLoadingSubject.next(loading);
	}
}
