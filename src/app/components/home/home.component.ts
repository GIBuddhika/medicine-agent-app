import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';

import { AgmMap, AgmInfoWindow, MapsAPILoader, GoogleMapsAPIWrapper } from '@agm/core';

import { ProductsService } from '../../services/products.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { merge, Observable, Subject } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, filter, map, takeUntil, finalize } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { MetaService } from 'app/services/meta.service';
import { CurrencyPipe } from '@angular/common';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    // districts = JSON.parse(localStorage.getItem('districts'));
    // districtNames = [];
    // districtName: string;
    // districtId: number;
    imagePath: string = "";
    isLoading: boolean = true;
    locations: any = [];
    products: any = [];
    searchForm: FormGroup;
    searchData: any = {
        searchTerm: "",
        districtId: "",
        cityId: ""
    }
    cities: any = [];
    cityName: string;
    cityNames: any = [];
    districts = JSON.parse(localStorage.getItem('districts'));
    districtNames = [];
    districtName: string;
    districtId: number;
    // isCityError: boolean = false;
    // isDistrictError: boolean = false;

    @ViewChild('instance', { static: true }) instance: NgbTypeahead;
    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    focusCities$ = new Subject<string>();
    clickCities$ = new Subject<string>();

    @ViewChild(AgmMap, { static: false }) map: AgmMap;
    lat: number;
    lng: number;
    infoWindowData: string;
    currentIW: AgmInfoWindow;
    previousIW: AgmInfoWindow;
    infoWindowProducts: any = [];

    geoCoder;
    pageSize = 10;
    page = 1;
    totalCount: number = 0;

    constructor(
        private productsService: ProductsService,
        private envLoader: RuntimeEnvLoaderService,
        private formBuilder: FormBuilder,
        private metaService: MetaService,
        private mapsAPILoader: MapsAPILoader,
        private ngZone: NgZone,
        private currencyPipe: CurrencyPipe,
        private updateMainViewSharedService: UpdateMainViewSharedService
    ) {
        this.updateMainViewSharedService.updateMainView("home");
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
        this.page = localStorage.getItem('current_page') ? parseInt(localStorage.getItem('current_page')) : 1;
        this.districts.forEach(district => {
            this.districtNames.push(district.name);
        });
    }

    ngOnInit() {
        this.getMainData();
        this.searchForm = this.formBuilder.group({
            searchTerm: new FormControl('', []),
        });
        this.mapsAPILoader.load().then(() => {
            // this.setCurrentLocation();
            this.geoCoder = new google.maps.Geocoder;
        });
        //load products near the customer. But couldn't detect the city properly.
        // this.mapsAPILoader.load().then((res) => {
        //     console.log(res);
        //     navigator.geolocation.getCurrentPosition((position) => {
        //         alert(position.coords.latitude);
        //         alert(position.coords.longitude);
        //         console.log(position);
        //         this.geoCoder.geocode({ 'location': { lat: position.coords.latitude, lng: position.coords.longitude } }, (results, status) => {
        //             console.log(results);
        //             console.log(status);


        //         });

        //         // this.latitude = position.coords.latitude;
        //         // this.longitude = position.coords.longitude;
        //         // this.zoom = 8;
        //         // this.getAddress(this.latitude, this.longitude);
        //     });

        //     // this.setCurrentLocation();
        //     // this.geoCoder = new google.maps.Geocoder;
        //     // console.log(new google.maps.Geocoder);

        // });
    }

    ngOnDestroy(): void {

    }

    getMainData() {
        this.productsService.all(this.page, this.pageSize)
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isLoading = false;
            }))
            .subscribe(response => {
                this.manageProperties(response);
            });
    }

    manageProperties(response) {
        this.products = response.data;
        console.log(this.products);

        this.totalCount = response.total_count;
        if (this.totalCount == 0) {
            return false;
        }

        this.currentIW = null;
        this.previousIW = null;
        this.locations = [];

        this.products.forEach(product => {
            if (product.image_id) {
                product.image_url = this.imagePath + product.files.find(file => file.id == product.image_id).location;
            } else if (product.files.length > 0) {
                product.image_url = this.imagePath + product.files[0].location;
            } else if (product.shop.file_id) {
                product.image_url = this.imagePath + product.shop.file.location;
            } else {
                product.image_url = '/assets/img/default-product.png';
            }
            this.locations.push({
                id: product.id,
                lat: product.shop.latitude,
                lng: product.shop.longitude
            });
        });
        this.lat = parseFloat(this.locations[0].lat);
        this.lng = parseFloat(this.locations[0].lng);
    }

    mapClick() {
        if (this.previousIW) {
            this.previousIW.close();
        }
    }

    markerClick(infoWindow, location) {
        var products = this.products.filter(product => product.shop.latitude == location.lat && product.shop.longitude == location.lng); //there can be multiple products from same location
        this.infoWindowProducts = [];
        products.forEach((product) => {
            var price = "Rs. " + (product.category_id == 1 ? this.currencyPipe.transform(product.sellable_item.retail_price, '', '') : (this.currencyPipe.transform(product.rentable_item.price_per_month, '', '') + ' Per month'));
            var shopName = product.is_a_shop_listing == 1 ? ("(" + product.shop.name + ")") : "";
            this.infoWindowProducts.push({
                'name': product.name,
                'price': price,
                'shopName': shopName,
                'slug': product.slug
            });
        });

        if (this.previousIW) {
            this.currentIW = infoWindow;
            this.previousIW.close();
        }
        this.previousIW = infoWindow;
    }

    paginate(event) {
        this.page = event;
        this.isLoading = true;
        this.productsService.all(this.page, this.pageSize)
            .pipe(take(1))
            .pipe(finalize(() => {
                localStorage.setItem('current_page', this.page.toString());
                this.isLoading = false;
            }))
            .subscribe(response => {
                this.manageProperties(response);
            });
    }

    clearSearchTerm() {
        this.searchForm.controls.searchTerm.setValue(null);
    }
    clearDistrict() {
        this.districtName = null;
    }
    clearCity() {
        this.cityName = null;
    }

    async searchItems() {
        this.searchData = {};
        this.page = 1;
        localStorage.setItem('current_page', this.page.toString());
        console.log(this.districtName);
        console.log(this.cityName);

        if (this.searchForm.controls.searchTerm.value) {
            this.searchData.searchTerm = this.searchForm.controls.searchTerm.value
        }
        if (this.districtName) {
            this.searchData.districtId = this.districts.filter(v => v.name.toLowerCase() == this.districtName.toLowerCase())[0].id;
        }
        if (this.cityName) {
            this.searchData.cityId = this.cities.filter(v => v.name.toLowerCase() == this.cityName.toLowerCase())[0].id;
        }

        const products = await this.productsService.all(this.page, this.pageSize, this.searchData).toPromise();
        this.manageProperties(products);
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

    selectedDistrict(event) {
        this.districtName = event.item;
        var districtObj = this.districts.filter(v => v.name.toLowerCase() == this.districtName.toLowerCase());
        this.getCities(districtObj[0].id);
    }

    selectedCity(event) {
        this.cityName = event.item;
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
}
