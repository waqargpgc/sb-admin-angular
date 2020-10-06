import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PipeTransform } from '@angular/core';
//import { COUNTRIES } from '@modules/tables/data/countries';
import { SortDirection } from '@modules/tables/directives';
import { Country } from '@modules/tables/models';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, switchMap, tap } from 'rxjs/operators';

interface SearchResult {
    countries: Country[];
    total: number;
}

interface State {
    page: number;
    pageSize: number;
    searchTerm: string;
    sortColumn: string;
    sortDirection: SortDirection;
    start: Date;
    end: Date;
}

function compare(v1: number | string, v2: number | string) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(countries: Country[], column: string, direction: string): Country[] {
    if (direction === '') {
        return countries;
    } else {
        return [...countries].sort((a, b) => {
            const res = compare(a[column], b[column]);
            return direction === 'asc' ? res : -res;
        });
    }
}

function matches(country: Country, term: string, pipe: PipeTransform) {
    return (
        country.body.toLowerCase().includes(term.toLowerCase()) ||
        pipe.transform(country.userId).includes(term) ||
        country.title.includes(term)
    );
}


@Injectable({ providedIn: 'root' })
export class CountryService {
    private _loading$ = new BehaviorSubject<boolean>(true);
    private _search$ = new Subject<void>();
    private _searchto$ = new Subject<void>();
    private _countries$ = new BehaviorSubject<Country[]>([]);
    private _total$ = new BehaviorSubject<number>(0);
    private COUNTRIES: any = [];
    private _state: State = {
        page: 1,
        pageSize: 4,
        searchTerm: '',
        sortColumn: '',
        sortDirection: '',
        start: new Date(2001, 0, 1),
        end: new Date()
    };

    constructor(private pipe: DecimalPipe, private http: HttpClient) {
        this.getHeroes().subscribe(data => {
            let res: any = data;
            this.COUNTRIES = res;
            this.COUNTRIES.forEach((element: any) => {
                element.userId = this.randomDate().getFullYear();
            });
            //this._countries$.next(res);
            console.log(res);
        });

        this._search$
            .pipe(
                tap(() => this._loading$.next(true)),
                debounceTime(120),
                switchMap(() => this._search()),
                delay(120),
                tap(() => this._loading$.next(false))
            )
            .subscribe(result => {
                this._countries$.next(result.countries);
                this._total$.next(result.total);
            });

        this._search$.next();
    }
    getHeroes() {
        return this.http.get('https://jsonplaceholder.typicode.com/posts');
    }
    get countries$() {
        // return this.http.get('https://jsonplaceholder.typicode.com/posts');
        return this._countries$.asObservable();
    }
    get total$() {
        return this._total$.asObservable();
    }
    get loading$() {
        return this._loading$.asObservable();
    }
    get page() {
        return this._state.page;
    }
    set page(page: number) {
        this._set({ page });
    }
    get pageSize() {
        return this._state.pageSize;
    }
    set pageSize(pageSize: number) {
        this._set({ pageSize });
    }
    get searchTerm() {
        return this._state.searchTerm;
    }
    set searchTerm(searchTerm: string) {
        this._set({ searchTerm });
    }
    set sortColumn(sortColumn: string) {
        this._set({ sortColumn });
    }
    set sortDirection(sortDirection: SortDirection) {
        this._set({ sortDirection });
    }

    private _set(patch: Partial<State>) {
        Object.assign(this._state, patch);
        this._search$.next();
    }
    randomDate() {
        const { start, end } = this._state;
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    private _search(): Observable<SearchResult> {
        const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

        // 1. sort
        let countries = sort(this.COUNTRIES, sortColumn, sortDirection);

        // 2. filter
        countries = countries.filter(country => matches(country, searchTerm, this.pipe));
        const total = countries.length;

        // 3. paginate
        countries = countries.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        return of({ countries, total });
    }
    private searchByDate(value: any) {
        const { sortColumn, sortDirection } = this._state;
        // 1. sort
        let countries = sort(this.COUNTRIES, sortColumn, sortDirection);
        // 2. filter
        if (value !== "0") {
            countries = countries.filter(country => country.userId === value);
        }
        const total = countries.length;
        this._countries$.next(countries);
        this._total$.next(total);
    }
}
