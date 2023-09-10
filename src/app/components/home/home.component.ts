import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { ProductsService } from '../../services/products.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { merge, Observable, Subject } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, filter, map, finalize } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { MetaService } from 'app/services/meta.service';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';
import { ActivatedRoute, Params, Router } from '@angular/router';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    imagePath: string = "";
    isLoading: boolean = true;
    isLoadingPage: boolean = true;
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

    @ViewChild('instance', { static: true }) instance: NgbTypeahead;
    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    focusCities$ = new Subject<string>();
    clickCities$ = new Subject<string>();

    lat: number;
    lng: number;
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
        private updateMainViewSharedService: UpdateMainViewSharedService,
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.updateMainViewSharedService.updateMainView("home");
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
        this.page = localStorage.getItem('current_page') ? parseInt(localStorage.getItem('current_page')) : 1;
        this.districts.forEach(district => {
            this.districtNames.push(district.name);
        });
    }

    async ngOnInit() {
        this.route.queryParams.subscribe(async (param: Params) => {
            if (param.action == null) {
                this.mapsAPILoader.load().then(() => {
                    this.geoCoder = new google.maps.Geocoder;
                    this.getMainData();
                });
                this.searchForm = this.formBuilder.group({
                    searchTerm: new FormControl("", []),
                });
            } else {
                if (param.district) {
                    let district = this.districts.find(dis => (dis.name).toLowerCase() == (param.district).toLowerCase());
                    if (district) {
                        this.districtName = district ? district.name : null;
                        this.searchData.districtId = district.id;
                        this.cities = await this.getCitiesByDistrict(district.id);
                        if (param.city) {
                            let city = this.cities.find(city => (city.name).toLowerCase() == (param.city).toLowerCase());
                            if (city) {
                                this.cityName = city ? city.name : null;
                                this.searchData.cityId = city.id;
                            }
                        }
                    }
                }

                this.searchData.searchTerm = param.search ?? "";

                this.page = param.page ?? 1;
                this.searchData.page = this.page;
                this.searchForm = this.formBuilder.group({
                    searchTerm: new FormControl(this.searchData.searchTerm, []),
                });

                this.searchItems(false);
            }
            this.isLoadingPage = false;
        });
    }

    ngOnDestroy(): void {

    }

    async getMainData() {
        navigator.geolocation.getCurrentPosition(async (position) => {
            this.lat = position.coords.latitude;
            this.lng = position.coords.longitude;
            await this.getAddressFromGoogleMap();
            this.searchItems();
        }, async error => {
            this.lat = 6.9209984;
            this.lng = 79.8487188;
            await this.getAddressFromGoogleMap();
            this.searchItems();
        });
    }

    async getAddressFromGoogleMap() {
        return new Promise((resolve, reject) => {
            return this.metaService.getAddressFromGoogleMap(this.lat, this.lng).subscribe(async res => {
                console.log(res);

                let town = this.getAddress(res, "administrative_area_level_4");
                let city = this.getAddress(res, "administrative_area_level_3");
                let district = this.getAddress(res, "administrative_area_level_2");

                let districtObj;
                if (district) {
                    districtObj = this.districts.find(dis => dis.name == district);
                    this.districtName = district;
                } else {
                    districtObj = this.districts.find(dis => dis.name == 'Colombo');
                    this.districtName = 'Colombo';
                }

                await this.getCitiesByDistrict(districtObj.id);
                let townName = this.cityNames.find(cityItem => cityItem == town);
                if (townName) {
                    this.cityName = town;
                } else {
                    let cityName = this.cityNames.find(cityItem => cityItem == city);
                    if (cityName) {
                        this.cityName = city;
                    } else {
                        //Since there are no city called `Colombo`, we take items which located in `Kollupitiya`
                        this.cityName = this.districtName == 'Colombo' ? 'Kollupitiya' : this.districtName;
                    }
                }
                resolve(this.cityName);
            });
        });
    }

    manageProperties(response) {
        this.products = response.data;
        this.totalCount = response.total_count;
        if (this.totalCount == 0) {
            return false;
        }

        this.products.forEach(product => {
            if (product.files.length > 0) {
                product.image_url = this.imagePath + product.files.find(file => file.is_default == true).location;
            } else if (product.shop && product.shop.image_path) {
                product.image_url = this.imagePath + product.shop.image_path;
            } else {
                product.image_url = '/assets/img/default-product.jpeg';
            }
        });
    }

    clearSearchTerm() {
        this.searchForm.controls.searchTerm.setValue(null);
        this.searchData.searchTerm = null;
    }
    clearDistrict() {
        this.districtName = null;
        this.cities = [];
        this.clearCity();
    }
    clearCity() {
        this.cityName = null;
    }

    onClickSearch(page = 1) {
        this.page = page;
        this.router.navigate([], {
            queryParams: {
                search: this.searchForm.controls.searchTerm.value,
                district: this.districtName,
                city: this.cityName,
                action: 'search',
                page: this.page
            }
        });
    }

    async searchItems(isInitial = true) {
        this.isLoading = true;
        this.searchData = {};
        localStorage.setItem('current_page', this.page.toString());

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

        if (products.total_count == 0 && this.districtName) {
            if (isInitial == true && this.cityName) {
                console.log('fetch by district');
                this.cityName = null;
                this.searchData.cityId = null;
                this.searchItems(false);
            } else if (isInitial == true && !this.cityName) {
                console.log('fetch whole country');
                this.districtName = null;
                this.searchData.districtId = null;
                this.searchItems(false);
            }
        }

        this.manageProperties(products);
        this.isLoading = false;
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
        this.getCitiesByDistrict(districtObj[0].id);
    }

    selectedCity(event) {
        this.cityName = event.item;
    }

    getCitiesByDistrict(districtId) {
        this.cityNames = [];
        this.cities = [];
        this.cityName = null;

        return new Promise((resolve, reject) => {
            return this.metaService.getCities(districtId)
                .pipe(take(1))
                .subscribe(response => {
                    this.cities = response;
                    this.cities.forEach(city => {
                        this.cityNames.push(city.name);
                    });
                    resolve(this.cities);
                });
        });
    }

    getAddress(addressData, searchBy) {
        let address = addressData.results.find(function (address) {
            let b = address.types.filter(function (type) {
                if (type == searchBy) {
                    return address;
                }
            });
            if (Object.keys(b).length > 0) {
                return b;
            }
        });
        if (address && !(address.formatted_address.split(",")[0]).includes("Unnamed")) {
            return address.formatted_address.split(",")[0];

        } else {
            return false;
        }
    }
}
