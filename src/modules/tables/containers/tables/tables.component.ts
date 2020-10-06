import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CountryService } from '@modules/tables/services';

@Component({
    selector: 'sb-tables',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './tables.component.html',
    styleUrls: ['tables.component.scss'],
})
export class TablesComponent implements OnInit {
    public year:any;
    constructor(public countryService: CountryService,) {
    }
    ngOnInit() {}
}
