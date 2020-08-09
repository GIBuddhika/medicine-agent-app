import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { take, finalize } from 'rxjs/operators';

import { AgmMap, AgmInfoWindow } from '@agm/core';

import { ProductsService } from '../../services/products.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    imagePath: string = "";
    isLoading: boolean = true;
    locations: any = [];
    products: any = [];

    @ViewChild(AgmMap, { static: false }) map: AgmMap;
    lat: number;
    lng: number;
    infoWindowData: string;
    currentIW: AgmInfoWindow;
    previousIW: AgmInfoWindow;
    infoWindowProducts: any = [];

    pageSize = 2;
    page = 1;
    totalCount: number = 0;

    constructor(
        private productsService: ProductsService,
        private envLoader: RuntimeEnvLoaderService,
    ) {
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
        this.page = localStorage.getItem('current_page') ? parseInt(localStorage.getItem('current_page')) : 1;
    }

    ngOnInit() {
        this.getMainData();
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
        this.totalCount = response.total_count;

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
            var price = "Rs. " + (product.category_id == 1 ? product.sellable_item.retail_price : (product.rentable_item.price_per_month + ' Per month'));
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
}
