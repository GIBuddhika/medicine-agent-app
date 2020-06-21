import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Subject, Observable, merge } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsersService } from 'app/services/users.service';
import { NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { MetaService } from 'app/services/meta.service';

@Component({
    selector: 'app-my-shops',
    templateUrl: './my-shops.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./my-shops.component.scss']
})
export class MyShopsComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();

    modalRef: any;
    errorMessage: any;
    shops: any = [];
    isSubmitted: boolean = false;
    createShopForm: FormGroup;
    submitting: boolean = false;
    isDistrictError: boolean = false;
    isCityError: boolean = false;

    cities: any = [];
    cityName: string;
    cityId: number;
    cityNames: any = [];

    districts = JSON.parse(localStorage.getItem('districts'));
    districtNames = [];
    districtName: string;
    districtId: number;

    @ViewChild('instance', { static: true }) instance: NgbTypeahead;
    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    focusCities$ = new Subject<string>();
    clickCities$ = new Subject<string>();

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private usersService: UsersService,
        private modalService: NgbModal,
        private metaService: MetaService
    ) {
        this.districts.forEach(district => {
            this.districtNames.push(district.name);
        });
    }

    ngOnInit() {
        this.getMainData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    getMainData() {
        this.usersService.getShops()
            .pipe(take(1))
            .subscribe(response => {
                this.shops = response;
            });
    }

    openCreateModal(content) {
        this.createShopForm = this.formBuilder.group({
            name: new FormControl('', [Validators.required]),
            address: new FormControl('', [Validators.required]),
            phone: new FormControl('', [Validators.required]),
            website: new FormControl('', [Validators.required]),
        });

        this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
    }

    searchDistricts = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => false));
        const inputFocus$ = this.focus$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            map(term => (term === '' ? this.districtNames
                : this.districtNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
            ))
        );
    }

    searchCities = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => false));
        const inputFocus$ = this.focusCities$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            map(term => (term === '' ? this.cityNames
                : this.cityNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
            ))
        );
    }

    focusOut(event) {
        if (this.districtNames.filter(v => v.toLowerCase() == this.districtName.toLowerCase()).length == 1) {
            this.isDistrictError = false;
            var districtObj = this.districts.filter(v => v.name.toLowerCase() == this.districtName.toLowerCase());
            this.getCities(districtObj[0].id);
        } else {
            this.isDistrictError = true;
        }
    }

    focusOutCities() {
        if (this.cityName && this.cityNames.filter(v => v.toLowerCase() == this.cityName.toLowerCase()).length == 1) {
            this.isCityError = false;
        } else {
            this.isCityError = true;
        }
    }

    selectedDistrict(event) {
        this.districtName = event.item;
        this.isDistrictError = false;
        var districtObj = this.districts.filter(v => v.name.toLowerCase() == this.districtName.toLowerCase());
        this.getCities(districtObj[0].id);
    }

    selectedCity(event) {
        this.cityName = event.item;
        this.isCityError = false;
    }

    getCities(districtId) {
        this.cityNames = [];
        this.cities = [];
        this.cityName = null;
        this.metaService.getCities(districtId)
            .pipe(take(1))
            .subscribe(response => {
                this.cities = response;
                this.cities.forEach(city => {
                    this.cityNames.push(city.name);
                });
            });
    }

    createShop() {
        console.log(this.districtName);
        console.log(this.cityName);

    }
}
