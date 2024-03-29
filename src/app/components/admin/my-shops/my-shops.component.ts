import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, merge, pipe } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, filter, map, takeUntil, finalize, isEmpty } from 'rxjs/operators';
import { NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { AgmMap } from '@agm/core';
import { MouseEvent as AGMMouseEvent } from '@agm/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import Swal from 'sweetalert2'

import { APIValidationMessagesHelper } from '../../../helpers/api-validation-messages.helper';
import { MetaService } from '../../../services/meta.service';
import { RuntimeEnvLoaderService } from '../../../services/runtime-env-loader.service';
import { ShopsService } from '../../../services/shops.service';
import { UsersService } from '../../../services/users.service';
import { ValidationMessagesHelper } from '../../../helpers/validation-messages.helper';
import { LoginComponent } from 'app/components/Auth/login/login.component';
import { PhoneValidator } from 'app/validators/phone.validator';

@Component({
    selector: 'app-shops',
    templateUrl: './my-shops.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./my-shops.component.scss']
})
export class MyShopsComponent implements OnInit, OnDestroy, AfterViewInit {
    private destroy$: Subject<any> = new Subject();
    @ViewChild('openCreateModalId') openCreateModalId: ElementRef<HTMLElement>;

    croppedImage: any;
    errorMessage: any;
    errorMessages: string = null;
    fileName: string = "";
    imageChangedEvent: any = '';
    imagePath: string = "";
    isCityError: boolean = false;
    isCreatingProcess: boolean;
    isDistrictError: boolean = false;
    isLoading: boolean = true;
    isSubmitted: boolean = false;
    isSubmitting: boolean = false;
    isUpdating: boolean = false;
    modalRef: any;
    phone: number;
    selectedShopAdmin: any;
    selectedShopAdminsList: any = [];
    shopAdmins: any = [];
    shopAdminsOriginal: any = [];
    shopForm: FormGroup;
    shops: any = [];
    showCropper = false;
    url: any;

    @ViewChild(AgmMap, { static: false }) map: AgmMap;
    zoom: number = 8;
    lat: number = 6.932942971060562;
    lng: number = 79.84612573779296;
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

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private usersService: UsersService,
        private modalService: NgbModal,
        private metaService: MetaService,
        private shopsService: ShopsService,
        private validationMessagesHelper: ValidationMessagesHelper,
        private APIValidationMessagesHelper: APIValidationMessagesHelper,
        private envLoader: RuntimeEnvLoaderService,
        private activatedRoute: ActivatedRoute,
    ) {
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
        this.districts.forEach(district => {
            this.districtNames.push(district.name);
        });
    }

    ngOnInit() {
        this.getMainData();
    }

    ngAfterViewInit() {
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['action'] == "add") {
                let el: HTMLElement = this.openCreateModalId.nativeElement;
                el.click();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getMainData() {
        this.usersService.getShops()
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isLoading = false;
            }))
            .subscribe(response => {
                this.shops = response;
            });

        this.usersService.getCurrentUser()
            .pipe(take(1))
            .subscribe(response => {
                this.phone = response.phone;
            });

        this.usersService.getShopAdmins()
            .pipe(take(1))
            .subscribe(response => {
                this.shopAdminsOriginal = response;
            });
    }

    openCreateModal(content) {
        this.errorMessages = null;
        this.isCreatingProcess = true;
        this.croppedImage = null;
        this.showCropper = false;
        this.shopAdmins = this.shopAdminsOriginal;
        this.selectedShopAdminsList = [];
        this.lat = 6.932942971060562;
        this.lng = 79.84612573779296;

        this.shopForm = this.formBuilder.group({
            name: new FormControl('', [Validators.required]),
            address: new FormControl('', [Validators.required]),
            phone: new FormControl(this.phone, [Validators.required, PhoneValidator]),
            website: new FormControl('', []),
        });
        this.cityName = null;
        this.districtName = null;
        this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
        this.shopForm.valueChanges
            .pipe(takeUntil(this.destroy$)) //should takeUntil because else the method not keep calling while change the inputs
            .subscribe(data => {
                if (this.isSubmitted) {
                    this.validationMessagesHelper.showErrorMessages(this.shopForm);
                }
            });
    }

    openEditModal(content, shop) {
        this.errorMessages = null;
        this.isCreatingProcess = false;
        this.shopAdmins = this.shopAdminsOriginal;

        this.shopForm = this.formBuilder.group({
            id: new FormControl(shop.id, []),
            name: new FormControl(shop.name, [Validators.required]),
            address: new FormControl(shop.address, [Validators.required]),
            phone: new FormControl(shop.phone, [Validators.required, PhoneValidator]),
            website: new FormControl(shop.website, []),
        });
        this.lat = parseFloat(shop.latitude);
        this.lng = parseFloat(shop.longitude);
        this.getCities(shop.city.district_id);
        this.cityName = shop.city.name;
        this.districtName = this.districts.filter(dis => dis.id == shop.city.district_id)[0].name;
        this.zoom = 15;
        this.croppedImage = null;


        this.selectedShopAdminsList = shop.shop_admins;
        let shopAdminIds = this.selectedShopAdminsList.map(shop => shop.id);
        this.shopAdmins = this.shopAdminsOriginal.filter(shop => {
            return !shopAdminIds.includes(shop.id);
        });

        this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });

        this.shopForm.valueChanges
            .pipe(takeUntil(this.destroy$)) //should takeUntil because else the method not keep calling while change the inputs
            .subscribe(data => {
                if (this.isSubmitted) {
                    this.validationMessagesHelper.showErrorMessages(this.shopForm);
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

    focusOut() {
        if (this.districtName != undefined && this.districtNames.filter(v => v.toLowerCase() == this.districtName.toLowerCase()).length == 1) {
            this.isDistrictError = false;
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
        return new Promise((resolve, reject) => {
            return this.metaService.getCities(districtId)
                .pipe(take(1))
                .subscribe(response => {
                    this.cities = response;
                    this.cities.forEach(city => {
                        this.cityNames.push(city.name);
                    });
                    resolve(this.cityNames);
                });
        }
        );
    }

    async markerDragEnd(event: AGMMouseEvent) {
        this.lat = event.coords.lat;
        this.lng = event.coords.lng;

        this.metaService.getAddressFromGoogleMap(this.lat, this.lng).subscribe(res => {
            let streetAddress = this.getAddress(res, "street_address");
            let route = this.getAddress(res, "route");
            let town = this.getAddress(res, "administrative_area_level_4");
            let city = this.getAddress(res, "administrative_area_level_3");
            let district = this.getAddress(res, "administrative_area_level_2");

            let fullAddress = (streetAddress ? (streetAddress + ", ") : "")
                + (route ? (route + ", ") : "")
                + (town ? (town + ", ") : "")
                + (city ? (city + ", ") : "")
                ;

            this.shopForm.get('address').setValue(fullAddress);

            this.districtName = district;
            let districtObj = this.districts.find(dis => dis.name == district)

            this.getCities(districtObj.id).then(res => {
                let cityName = this.cityNames.find(cityItem => cityItem == city);
                if (cityName) {
                    this.cityName = cityName;
                } else {
                    //Since there are no city called `Colombo`, we take items which located in `Kollupitiya`
                    this.cityName = this.districtName == 'Colombo' ? 'Kollupitiya' : this.districtName;
                }
                this.focusOut();
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

    mapClicked(event) {
        this.lat = event.coords.lat;
        this.lng = event.coords.lng;
        this.markerDragEnd(event);
    }

    createShop() {
        this.errorMessages = null;
        this.isCityError = false;
        this.isDistrictError = false;
        this.isSubmitted = true;
        var hasError = false;
        this.validationMessagesHelper.showErrorMessages(this.shopForm);
        if (!this.shopForm.valid) {
            hasError = true;
        }
        if (this.districtName == undefined) {
            this.isDistrictError = true;
            hasError = true;
        }
        if (this.cityName == undefined) {
            this.isCityError = true;
            hasError = true;
        }
        if (hasError) {
            this.scrollToTop();
            return false;
        }
        this.isSubmitting = true;
        const data = {
            name: this.shopForm.value.name,
            city_id: this.cities.filter(v => v.name == this.cityName)[0].id,
            address: this.shopForm.value.address,
            phone: this.shopForm.value.phone,
            website: this.shopForm.value.website,
            latitude: this.lat,
            longitude: this.lng,
            image: this.croppedImage,
            image_name: this.fileName,
            shop_admin_ids: JSON.stringify(this.selectedShopAdminsList.map(({ id }) => id)),
        };
        this.shopsService.create(data)
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isSubmitting = false;
            }))
            .subscribe(response => {
                Swal.fire(
                    'Success',
                    'New shop created.',
                    'success'
                );
                this.modalRef.close();
                this.getMainData();
            }, error => {
                if (error.code == 400) {
                    this.errorMessages = this.APIValidationMessagesHelper.showErrorMessages(error.errors);
                    this.scrollToTop();
                } else {
                    Swal.fire(
                        'Sorry',
                        'Something went wrong, Please try again.',
                        'error'
                    );
                    this.modalRef.close();
                }
            });
    }

    updateShop() {
        this.errorMessages = null;
        this.isCityError = false;
        this.isDistrictError = false;
        this.isSubmitted = true;
        var hasError = false;
        this.validationMessagesHelper.showErrorMessages(this.shopForm);

        if (!this.shopForm.valid) {
            hasError = true;
        }
        if (this.districtName == undefined || this.districts.filter(v => v.name == this.districtName).length == 0) {
            this.isDistrictError = true;
            hasError = true;
        }
        if (this.cityName == undefined || this.cities.filter(v => v.name == this.cityName).length == 0) {
            this.isCityError = true;
            hasError = true;
        }
        if (hasError) {
            this.scrollToTop();
            return false;
        }
        this.isUpdating = true;
        const data = {
            name: this.shopForm.value.name,
            city_id: this.cities.filter(v => v.name == this.cityName)[0].id,
            address: this.shopForm.value.address,
            phone: this.shopForm.value.phone,
            website: this.shopForm.value.website,
            latitude: this.lat,
            longitude: this.lng,
            image: this.croppedImage,
            image_name: this.fileName,
            shop_admin_ids: JSON.stringify(this.selectedShopAdminsList.map(({ id }) => id)),
        };
        this.shopsService.update(this.shopForm.value.id, data)
            .pipe(finalize(() => {
                this.isUpdating = false;
            }))
            .pipe(take(1))
            .subscribe(response => {
                Swal.fire(
                    'Success',
                    'Shop updated.',
                    'success'
                );
                this.fileName = null;
                this.modalService.dismissAll();
                this.getMainData();
            }, error => {
                if (error.code == 400) {
                    this.errorMessages = this.APIValidationMessagesHelper.showErrorMessages(error.errors);
                    this.scrollToTop();
                } else {
                    Swal.fire(
                        'Sorry',
                        'Something went wrong, Please try again.',
                        'error'
                    );
                    this.modalRef.close();
                }
            });
    }

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
        this.fileName = event.target.files[0].name;
    }

    imageLoaded() {
        this.showCropper = true;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }

    scrollToTop() {
        var main = document.getElementsByClassName("custom-class")[0];
        main.getElementsByClassName("modal-header")[0].scrollIntoView({ behavior: 'smooth' });
    }

    deleteShop(shopId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the shop.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            reverseButtons: true,
            focusCancel: true
        }).then((result) => {
            if (result.value) {
                this.shopsService.delete(shopId)
                    .subscribe(response => {
                        this.getMainData();
                        Swal.fire(
                            'Deleted!',
                            'Shop has been deleted.',
                            'success'
                        );
                    }, error => {
                        Swal.fire(
                            'Error!',
                            'Something went wrong. Please try again.',
                            'error'
                        );
                    });
            }
        })
    }

    assignShopAdmin() {
        console.log(this.selectedShopAdmin);
        console.log(this.selectedShopAdmin == "");
        if (this.selectedShopAdmin != "") {
            let selectedShopData = this.shopAdmins.find(shopAdmin => shopAdmin.id == this.selectedShopAdmin);
            this.shopAdmins = this.shopAdmins.filter(shopAdmin => shopAdmin.id != this.selectedShopAdmin);
            this.selectedShopAdminsList.push(selectedShopData);
            console.log(this.selectedShopAdminsList);

            this.selectedShopAdmin = "";
        }
    }

    unAssignShopAdmin(shopAdminId) {
        let selectedShopData = this.selectedShopAdminsList.find(shopAdmin => shopAdmin.id == shopAdminId);
        this.selectedShopAdminsList = this.selectedShopAdminsList.filter(shopAdmin => shopAdmin.id != shopAdminId);
        this.shopAdmins.push(selectedShopData);
        this.selectedShopAdmin = "";
    }

    showProducts(shopId) {
        this.router.navigateByUrl('/admin/products?type=shop&shopId=' + shopId);
    }
}

