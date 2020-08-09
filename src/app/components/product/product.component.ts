import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Subject } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
import { UpdateMainViewSharedService } from '../../shared-services/update-main-view.service';
import { Router } from '@angular/router';

import { AgmMap, AgmInfoWindow } from '@agm/core';

import { ProductsService } from '../../services/products.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';

@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit, OnDestroy {

    imagePath: string = "";
    isLoading: boolean = true;
    locations: any = [];
    page: number = 1;
    pageSize: number = 20;
    products: any = [];
    totalCount: number = 0;

    @ViewChild(AgmMap, { static: false }) map: AgmMap;
    lat: number;
    lng: number;
    infoWindowData: string;
    currentIW: AgmInfoWindow;
    previousIW: AgmInfoWindow;

    constructor(
        private productsService: ProductsService,
        private envLoader: RuntimeEnvLoaderService,
    ) {
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;

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
                this.products = response.data;
                this.totalCount = response.total_count;

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
                console.log(this.locations);

            });
    }

    mapClick() {
        if (this.previousIW) {
            this.previousIW.close();
        }
    }

    markerClick(infoWindow, location) {
        var products = this.products.filter(product => product.shop.latitude == location.lat && product.shop.longitude == location.lng); //there can be multiple products from same location
        this.infoWindowData = "";
        products.forEach((product, index) => {
            var price = product.category_id == 1 ? product.sellable_item.retail_price : (product.rentable_item.price_per_month + ' Per month');
            var shopName = product.category_id == 1 ? ("(" + product.shop.name + ")") : "";
            if (index > 0) {
                this.infoWindowData += "<hr>";
            }
            this.infoWindowData += product.name + shopName + "<br>Price:" + price + "<br><a href='" + product.slug + "'>More...</a>";
        });

        if (this.previousIW) {
            this.currentIW = infoWindow;
            this.previousIW.close();
        }
        this.previousIW = infoWindow;
    }
}
