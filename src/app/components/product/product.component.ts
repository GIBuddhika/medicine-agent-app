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
import Swal from 'sweetalert2';
import { CurrencyPipe } from '@angular/common';
import { updateCartCountService } from 'app/shared-services/update-cart-count.service';

@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit, OnDestroy {

    imagePath: string = "";
    isLoading: boolean = true;
    price: string;
    product: any = [];
    quantity: number = 1;
    duration: number = 1;
    shopName: string;
    slideIndex = 1;
    slug: string = "";
    quantityAlreadyInCart: number = 0;
    wholesaleMinimumQuantity: number;
    cart = localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];


    @ViewChild(AgmMap, { static: false }) map: AgmMap;
    lat: number;
    lng: number;
    infoWindowData: string;
    currentIW: AgmInfoWindow;
    previousIW: AgmInfoWindow;
    infoWindowProducts: any = [];

    constructor(
        private productsService: ProductsService,
        private envLoader: RuntimeEnvLoaderService,
        private router: Router,
        private currencyPipe: CurrencyPipe,
        private updateCartCountService: updateCartCountService,
    ) {
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
    }

    ngOnInit() {
        let currentUrl = this.router.url;
        let urlArray = currentUrl.split('/');
        this.slug = urlArray[2];
        this.getMainData();
        console.log(this.cart);
    }

    ngOnDestroy(): void {

    }

    getMainData() {
        this.productsService.get(this.slug)
            .pipe(take(1))
            .pipe(finalize(() => {
                this.isLoading = false;
                setTimeout(() => {
                    this.showSlides(this.slideIndex);
                }, 10);
            }))
            .subscribe(response => {
                this.product = response;
                console.log(this.product);
                this.price = "Rs. " + (this.product.category_id == 1 ? this.currencyPipe.transform(this.product.sellable_item.retail_price, '', '') : (this.currencyPipe.transform(this.product.rentable_item.price_per_month, '', '')));
                this.shopName = this.product.is_a_shop_listing == 1 ? ("(" + this.product.shop.name + ")") : "";
                this.wholesaleMinimumQuantity = Math.trunc(this.product.sellable_item?.wholesale_minimum_quantity);
                this.lat = parseFloat(this.product.shop.latitude);
                this.lng = parseFloat(this.product.shop.longitude);
                this.calculateRemainingQuantity();
            });
    }

    calculateRemainingQuantity() {
        let itemsAlreadyInCart = this.cart.filter((item) => {
            return item.id == this.product.id
        });
        if (itemsAlreadyInCart.length > 0) {
            this.quantityAlreadyInCart = itemsAlreadyInCart.map(a => a.quantity).reduce(function (a, b) {
                return a + b;
            });
        }
        this.product.quantity -= this.quantityAlreadyInCart;
    }

    plusSlides = function (n) {
        this.showSlides(this.slideIndex += n);
    }

    currentSlide = function (n) {
        this.showSlides(this.slideIndex = n);
    }

    showSlides(n) {
        let i;
        let slides = Array.from(document.getElementsByClassName("mySlides"));
        let dots = document.getElementsByClassName("demo");
        if (n > slides.length) { this.slideIndex = 1 }
        if (n < 1) { this.slideIndex = slides.length }
        for (i = 0; i < slides.length; i++) {
            slides[i].setAttribute("style", "display:none;");
        }
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        slides[this.slideIndex - 1].setAttribute("style", "display:block;");
        dots[this.slideIndex - 1].className += " active";
    }

    increaseValue() {
        this.quantity++;
        if (this.quantity > this.product.quantity) {
            this.quantity = this.product.quantity;
        }
    }

    decreaseValue() {
        if (this.quantity == 1) {
            this.quantity = 1;
        } else {
            this.quantity--;
        }
    }

    increaseValueDuration() {
        if (this.duration < 24) {
            this.duration++;
        }
    }

    decreaseValueDuration() {
        if (this.duration == 1) {
            this.duration = 1;
        } else {
            this.duration--;
        }
    }

    addToCart() {
        if (this.quantity > this.product.quantity) {
            Swal.fire(
                'No enough items available.',
                'Please re-enter the quantity or contact the shop owner for more details.',
                'error'
            );
            return false;
        }

        if (this.duration > 24) {
            Swal.fire(
                'Maximum rental period is 24 months',
                'Please re-enter the duration or contact the shop owner for more details.',
                'error'
            );
            return false;
        }

        let item = {
            'time': Date.now(),
            'id': this.product.id,
            'slug': this.product.slug,
            'quantity': this.quantity,
            'duration': null,
        };
        let product = this.product;

        if (product.rentable_item) {
            item.duration = this.duration;
            this.cart.push(item);
            localStorage.setItem("cart", JSON.stringify(this.cart));
        } else {
            let cartWithoutCurrentProduct = this.cart.filter(function (item) {
                return item.id !== product.id
            });
            cartWithoutCurrentProduct.push(item);
            localStorage.setItem("cart", JSON.stringify(cartWithoutCurrentProduct));
        }

        this.updateCartCountService.updateCartCount();
        Swal.fire({
            title: 'Added',
            text: "New product added to the cart.",
            icon: 'success',
            showCancelButton: true,
            cancelButtonText: 'ok',
            cancelButtonColor: '#eeeeee',
            confirmButtonText: 'Go to cart',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (result.value) {
                this.router.navigate(['cart']);
            }
        })
    }
}
