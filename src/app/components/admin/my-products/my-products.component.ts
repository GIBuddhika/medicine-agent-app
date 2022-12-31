import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import Swal from 'sweetalert2'

import { APIValidationMessagesHelper } from '../../../helpers/api-validation-messages.helper';
import { ProductsService } from '../../../services/products.service';
import { MetaService } from '../../../services/meta.service';
import { RuntimeEnvLoaderService } from '../../../services/runtime-env-loader.service';
import { UsersService } from '../../../services/users.service';
import { Subject, Observable, merge, forkJoin } from 'rxjs';
import { take, finalize, takeUntil, debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { AgmMap } from '@agm/core';
import { MouseEvent as AGMMouseEvent } from '@agm/core';
import { typeWithParameters } from '@angular/compiler/src/render3/util';
import { ValidationMessagesHelper } from 'app/helpers/validation-messages.helper';

@Component({
    selector: 'app-my-products',
    templateUrl: './my-products.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./my-products.component.scss']
})
export class MyProductsComponent implements OnInit, OnDestroy {
    private destroy$: Subject<any> = new Subject();

    croppedImage: any;
    errorMessage: any;
    errorMessages: string = null;
    fileName: string = "";
    imageChangedEvent: any = '';
    imagePath: string = "";
    isAShopListing: boolean;
    isCreatingProcess: boolean;
    isLoading: boolean = true;
    isSubmitted: boolean = false;
    isSubmitting: boolean = false;
    isUpdating: boolean = false;
    modalRef: any;
    productForm: FormGroup;
    productId: number;
    products: any = [];
    pricingCategory: string = "sell";
    shops: any = [];
    showCropper = false;
    showSubImagesError = null;
    url: any;
    subImagesList = [];
    shopName: string = null;
    shopNames: any = [];
    isShopError: boolean = false;
    isWholesalePricingEnabled: boolean;
    user: any = [];

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
    isCityError: boolean = false;
    isDistrictError: boolean = false;

    @ViewChild('instance', { static: true }) instance: NgbTypeahead;
    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    focusCities$ = new Subject<string>();
    clickCities$ = new Subject<string>();

    pageSize = 10;
    totalCount: any;
    page = 1;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private usersService: UsersService,
        private modalService: NgbModal,
        private productsService: ProductsService,
        private validationMessagesHelper: ValidationMessagesHelper,
        private APIValidationMessagesHelper: APIValidationMessagesHelper,
        private envLoader: RuntimeEnvLoaderService,
        private metaService: MetaService,
    ) {
        this.districts.forEach(district => {
            this.districtNames.push(district.name);
        });
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
        this.isAShopListing = JSON.parse(localStorage.getItem('isAShopListing'));
    }

    ngOnInit() {
        this.getMainData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getMainData() {
        forkJoin(
            [
                this.usersService.getShops(),
                this.usersService.getProducts(this.page, this.pageSize),
                this.usersService.getCurrentUser()
            ])
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isLoading = false;
            }))
            .subscribe(response => {
                this.shops = response[0];
                this.products = response[1].data;
                this.totalCount = response[1].total_count
                this.user = response[2];
                console.log(this.user);

            });
    }

    openCreateModal(content) {
        this.errorMessages = null;
        this.isCreatingProcess = true;
        this.pricingCategory = localStorage.getItem('pricingCategory') ? localStorage.getItem('pricingCategory') : 'sell';
        this.isAShopListing = localStorage.getItem('isAShopListing') ? JSON.parse(localStorage.getItem('isAShopListing')) : true;
        var shopId = localStorage.getItem('shopId') ? JSON.parse(localStorage.getItem('shopId')) : '';

        this.productForm = this.formBuilder.group({
            listingCategory: new FormControl(this.isAShopListing, [Validators.required]),
            shopId: new FormControl(shopId, []),
            address: new FormControl(localStorage.getItem('address'), []),
            user_name: new FormControl(this.user.name, []),
            phone: new FormControl(this.user.phone, []),
            name: new FormControl('', [Validators.required]),
            description: new FormControl('', []),
            pricingCategory: new FormControl(this.pricingCategory, [Validators.required]),
            price: new FormControl('', [Validators.required]),
            quantity: new FormControl('', [Validators.required]),
            wholesale_price: new FormControl('', []),
            min_quantity: new FormControl('', []),
        });
        this.onChangeListingMethod();
        this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
        this.productForm.valueChanges
            .pipe(takeUntil(this.destroy$)) //should takeUntil because else the method not keep calling while change the inputs
            .subscribe(data => {
                if (this.isSubmitted) {
                    this.validationMessagesHelper.showErrorMessages(this.productForm);
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
        if (this.districtName != undefined && this.districtNames.filter(v => v.toLowerCase() == this.districtName.toLowerCase()).length == 1) {
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

    markerDragEnd(event: AGMMouseEvent) {
        this.lat = event.coords.lat;
        this.lng = event.coords.lng;
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

    expandTextarea() {
        let textArea = document.getElementById("description")
        textArea.style.overflow = 'hidden';
        textArea.style.height = 'auto';
        textArea.style.height = textArea.scrollHeight + 'px';
    }

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
        this.fileName = event.target.files[0].name;
    }

    fileChangeEventSubImage(event: any) {
        var file = event.target.files[0];
        this.showSubImagesError = null;
        if (this.subImagesList.filter(image => image.name == file.name).length > 0) {
            this.showSubImagesError = "Duplicate image.";
            return false;
        }
        if (this.subImagesList.length == 5) {
            this.showSubImagesError = "You've reached to max images count. Please delete image(s) before upload another.";
        } else {
            if (file.size > 5e+6) { //5MB
                this.showSubImagesError = "Max upload image size 5MB exceeded.";
            } else {
                this.getBase64(event.target.files[0]).then(data => {
                    this.subImagesList.push({ 'name': file.name, 'data': data })
                });
            }
        }
    }

    imageLoaded() {
        this.showCropper = true;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }

    getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    deleteSubImage(i) {
        this.subImagesList.splice(i, 1);
        if (this.subImagesList.length < 5) {
            this.showSubImagesError = null;
        }
    }

    scrollToTop() {
        var main = document.getElementsByClassName("custom-class")[0];
        main.getElementsByClassName("modal-header")[0].scrollIntoView({ behavior: 'smooth' });
    }

    addShop() {
        this.modalService.dismissAll();
        this.router.navigate(['/my-shops'], { queryParams: { 'action': 'add' } });
    }

    onChangePricingCategory() {
        if ((this.pricingCategory === 'sell' && this.isWholesalePricingEnabled == false) || this.pricingCategory === 'rent') {
            this.productForm.controls.price.setValidators([Validators.required]);
        }
        this.productForm.controls.price.updateValueAndValidity();
    }

    onChangeListingMethod() {
        if (this.isAShopListing === true) {
            this.productForm.controls.user_name.setValidators(null);
            this.productForm.controls.address.setValidators(null);
            this.productForm.controls.phone.setValidators(null);
            this.productForm.controls.shopId.setValidators([Validators.required]);
        } else {
            this.productForm.controls.shopId.setValidators(null);
            this.productForm.controls.user_name.setValidators([Validators.required]);
            this.productForm.controls.address.setValidators([Validators.required]);
            this.productForm.controls.phone.setValidators([Validators.required, Validators.pattern('\\d{2}[- ]?\\d{3}[- ]?\\d{4}')]);
        }
        this.productForm.controls.user_name.updateValueAndValidity();
        this.productForm.controls.address.updateValueAndValidity();
        this.productForm.controls.shopId.updateValueAndValidity();
        this.productForm.controls.phone.updateValueAndValidity();
    }

    onChangeWholesaleAvailability() {
        if (this.isWholesalePricingEnabled == true) {
            this.productForm.controls.min_quantity.setValidators([Validators.required]);
            this.productForm.controls.wholesale_price.setValidators([Validators.required]);
            this.productForm.controls.price.setValidators(null);
        } else {
            this.productForm.controls.min_quantity.setValidators(null);
            this.productForm.controls.wholesale_price.setValidators(null);
            this.productForm.controls.price.setValidators([Validators.required]);
        }
        this.productForm.controls.min_quantity.updateValueAndValidity();
        this.productForm.controls.wholesale_price.updateValueAndValidity();
        this.productForm.controls.price.updateValueAndValidity();
    }

    createProduct() {
        this.isCityError = false;
        this.isDistrictError = false;
        this.isSubmitted = true;
        var hasError = false;
        this.validationMessagesHelper.showErrorMessages(this.productForm);
        if (this.isAShopListing && this.shops.length == 0) {
            this.errorMessages = "Please add a shop before proceeding.";
        }
        console.log(this.productForm);

        if (!this.productForm.valid) {
            hasError = true;
        }
        if (!this.isAShopListing) {
            if (this.districtName == undefined || this.districts.filter(v => v.name == this.districtName).length == 0) {
                this.isDistrictError = true;
                hasError = true;
            }
            if (this.cityName == undefined || this.cities.filter(v => v.name == this.cityName).length == 0) {
                this.isCityError = true;
                hasError = true;
            }
        }
        if (hasError) {
            this.scrollToTop();
            return false;
        }
        this.isSubmitting = true;
        const data: any = {
            is_a_shop_listing: this.productForm.value.listingCategory,
            name: this.productForm.value.name,
            description: this.productForm.value.description,
            quantity: this.productForm.value.quantity,
            pricing_category: this.productForm.value.pricingCategory,
            price: this.productForm.value.price,
            image: this.croppedImage,
            image_name: this.fileName,
            sub_images: this.subImagesList,
            is_wholesale_pricing_enabled: this.isWholesalePricingEnabled
        };
        if (this.isAShopListing) {
            data.shop_id = this.productForm.value.shopId;
        } else {
            data.user_name = this.productForm.value.user_name;
            data.city_id = this.cities.filter(v => v.name == this.cityName)[0].id;
            data.address = this.productForm.value.address;
            data.phone = this.productForm.value.phone;
            data.latitude = this.lat;
            data.longitude = this.lng;
        }
        if (this.isWholesalePricingEnabled) {
            data.min_quantity = this.productForm.value.min_quantity;
            data.wholesale_price = this.productForm.value.wholesale_price;
        }

        localStorage.setItem('shopId', this.productForm.value.shopId);
        localStorage.setItem('pricingCategory', data.pricing_category);
        localStorage.setItem('isAShopListing', JSON.stringify(this.isAShopListing));
        localStorage.setItem('address', this.productForm.value.address);

        this.productsService.create(data)
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isSubmitting = false;
            }))
            .subscribe(response => {
                Swal.fire(
                    'Success',
                    'New product added.',
                    'success'
                );
                this.modalService.dismissAll();
                this.getMainData();
            }, error => {
                if (error.code == 400) {
                    var errorNamesForAPI = {
                        'is_a_shop_listing': 'Listing Category',
                        'shop_id': 'Shop',
                        'pricing_category': 'Pricing category',
                        'min_quantity': 'Minimum quantity',
                        'wholesale_price': 'Wholesale price',
                        'sub_images': 'Sub images',
                        'image_name': 'Image name',
                        'city_id': 'City',
                    };
                    this.errorMessages = this.APIValidationMessagesHelper.showErrorMessages(error.errors, errorNamesForAPI);
                    this.scrollToTop();
                } else {
                    Swal.fire(
                        'Sorry',
                        'Something went wrong, Please try again.',
                        'error'
                    );
                }
            });
    }

    paginate(event) {
        this.isLoading = true;
        this.usersService.getProducts(event, this.pageSize)
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isLoading = false;
            }))
            .subscribe(response => {
                this.products = response.data;
                this.totalCount = response.total_count;
            });
    }

    openEditModal(content, product) {
        this.productId = product.id;
        this.getCities(product.shop.city.district_id);
        this.errorMessages = null;
        this.isCreatingProcess = false;
        this.pricingCategory = product.sellable_item ? 'sell' : 'rent';
        this.isAShopListing = product.is_a_shop_listing ? true : false;
        this.districtName = this.districts.filter(dis => dis.id == product.shop.city.district_id)[0].name;
        this.cityName = product.shop.city.name;
        this.lat = parseFloat(product.shop.latitude);
        this.lng = parseFloat(product.shop.longitude);
        let address = product.shop.address;
        let shopId = product.shop.id;
        let price = product.sellable_item ? product.sellable_item.retail_price : product.rentable_item.retail_price;
        let wholesalePrice = product.sellable_item ? product.sellable_item.wholesale_price : product.rentable_item.wholesale_price;
        let wholesaleMinQuantity = product.sellable_item ? product.sellable_item.wholesale_minimum_quantity : product.rentable_item.wholesale_minimum_quantity;
        this.isWholesalePricingEnabled = wholesalePrice ? true : false;

        this.productForm = this.formBuilder.group({
            listingCategory: new FormControl('', [Validators.required]),
            shopId: new FormControl(shopId, []),
            address: new FormControl(address, []),
            user_name: new FormControl(this.user.name, []),
            phone: new FormControl(this.user.phone, []),
            name: new FormControl(product.name, [Validators.required]),
            description: new FormControl(product.description, []),
            pricingCategory: new FormControl(this.pricingCategory, [Validators.required]),
            price: new FormControl(price, [Validators.required]),
            quantity: new FormControl(product.quantity, [Validators.required]),
            wholesale_price: new FormControl(wholesalePrice, this.isWholesalePricingEnabled ? [Validators.required] : []),
            min_quantity: new FormControl(wholesaleMinQuantity, this.isWholesalePricingEnabled ? [Validators.required] : []),
        });
        this.onChangeListingMethod();
        this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
        this.productForm.valueChanges
            .pipe(takeUntil(this.destroy$)) //should takeUntil because else the method not keep calling while change the inputs
            .subscribe(data => {
                if (this.isSubmitted) {
                    this.validationMessagesHelper.showErrorMessages(this.productForm);
                }
            });
    }

    updateProduct() {
        this.isCityError = false;
        this.isDistrictError = false;
        this.isSubmitted = true;
        var hasError = false;
        this.validationMessagesHelper.showErrorMessages(this.productForm);
        if (this.isAShopListing && this.shops.length == 0) {
            this.errorMessages = "Please add a shop before proceeding.";
        }

        if (!this.productForm.valid) {
            hasError = true;
        }
        if (!this.isAShopListing) {
            if (this.districtName == undefined || this.districts.filter(v => v.name == this.districtName).length == 0) {
                this.isDistrictError = true;
                hasError = true;
            }
            if (this.cityName == undefined || this.cities.filter(v => v.name == this.cityName).length == 0) {
                this.isCityError = true;
                hasError = true;
            }
        }
        if (hasError) {
            this.scrollToTop();
            return false;
        }
        this.isSubmitting = true;
        const data: any = {
            is_a_shop_listing: this.productForm.value.listingCategory,
            name: this.productForm.value.name,
            description: this.productForm.value.description,
            quantity: this.productForm.value.quantity,
            pricing_category: this.productForm.value.pricingCategory,
            price: this.productForm.value.price,
            image: this.croppedImage,
            image_name: this.fileName,
            sub_images: this.subImagesList,
            is_wholesale_pricing_enabled: this.isWholesalePricingEnabled
        };
        if (this.isAShopListing) {
            data.shop_id = this.productForm.value.shopId;
        } else {
            data.user_name = this.productForm.value.user_name;
            data.city_id = this.cities.filter(v => v.name == this.cityName)[0].id;
            data.address = this.productForm.value.address;
            data.phone = this.productForm.value.phone;
            data.latitude = this.lat;
            data.longitude = this.lng;
        }
        if (this.isWholesalePricingEnabled) {
            data.min_quantity = this.productForm.value.min_quantity;
            data.wholesale_price = this.productForm.value.wholesale_price;
        }

        this.productsService.update(this.productId, data)
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isSubmitting = false;
            }))
            .subscribe(response => {
                Swal.fire(
                    'Success',
                    'Product updated.',
                    'success'
                );
                this.modalService.dismissAll();
                this.getMainData();
            }, error => {
                if (error.code == 400) {
                    var errorNamesForAPI = {
                        'is_a_shop_listing': 'Listing Category',
                        'shop_id': 'Shop',
                        'pricing_category': 'Pricing category',
                        'min_quantity': 'Minimum quantity',
                        'wholesale_price': 'Wholesale price',
                        'sub_images': 'Sub images',
                        'image_name': 'Image name',
                        'city_id': 'City',
                    };
                    this.errorMessages = this.APIValidationMessagesHelper.showErrorMessages(error.errors, errorNamesForAPI);
                    this.scrollToTop();
                } else {
                    Swal.fire(
                        'Sorry',
                        'Something went wrong, Please try again.',
                        'error'
                    );
                }
            });
    }

    deleteItem(productId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the product.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            reverseButtons: true,
            focusCancel: true
        }).then((result) => {
            if (result.value) {
                this.productsService.delete(productId)
                    .subscribe(response => {
                        this.getMainData();
                        Swal.fire(
                            'Deleted!',
                            'Product has been deleted.',
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
}
