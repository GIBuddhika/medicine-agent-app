import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Subject, Observable, merge, pipe } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsersService } from 'app/services/users.service';
import { NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { MetaService } from 'app/services/meta.service';
import { AgmMap } from '@agm/core';
import { ValidationMessagesHelper } from 'app/helpers/validation-messages.helper';
import { MouseEvent as AGMMouseEvent } from '@agm/core';

@Component({
    selector: 'app-my-shops',
    templateUrl: './my-shops.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./my-shops.component.scss']
})
export class MyShopsComponent implements OnInit, OnDestroy {
    private destroy$: Subject<any> = new Subject();

    @ViewChild(AgmMap, { static: false }) map: AgmMap;

    zoom: number = 8;
    lat: number = 6.932942971060562;
    lng: number = 79.84612573779296;

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
        private metaService: MetaService,
        private validationMessagesHelper: ValidationMessagesHelper,
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
            phone: new FormControl('', [Validators.required, Validators.pattern('\\d{3}[- ]?\\d{3}[- ]?\\d{4}')]),
            website: new FormControl('', []),
        });
        this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
        this.createShopForm.valueChanges
            .pipe(takeUntil(this.destroy$)) //should takeUntil because else the method not keep calling while change the inputs
            .subscribe(data => {
                if (this.isSubmitted) {
                    this.validationMessagesHelper.showErrorMessages(this.createShopForm);
                }
            });
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
            this.getCoordinatesOfCity();
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
        this.getCoordinatesOfCity();
    }

    getCoordinatesOfCity() {
        this.usersService.getCoordinatesByAddress(this.cityName + "+" + this.districtName)
            .pipe(take(1))
            .subscribe(response => {
                this.lat = response.results[0].geometry.location.lat;
                this.lng = response.results[0].geometry.location.lng;
                this.zoom = 12;
            });
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
        this.isSubmitted = true;
        this.validationMessagesHelper.showErrorMessages(this.createShopForm);
        if (!this.createShopForm.valid) {
            console.log(this.createShopForm);
            return false;
        }
    }

    markerDragEnd(event: AGMMouseEvent) {
        this.lat = event.coords.lat;
        this.lng = event.coords.lng;
        console.log(this.lat);
        console.log(this.lng);
    }
}
