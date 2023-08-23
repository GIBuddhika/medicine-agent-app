import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { take, finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

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
export class ProductComponent implements OnInit {

    activeTab: string = "description";
    totalReviewWidth: string = "10px";
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
    images = [];
    isEditProduct: boolean = false;
    editItemQuantity: number = 0;
    editItemIndex: number;
    noteForAdmin: string = "";

    pageSize = 10;
    page = 1;
    totalCount: number = 0;

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
        private activeRoute: ActivatedRoute
    ) {
        this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
    }

    ngOnInit() {
        this.slug = this.activeRoute.snapshot.paramMap.get('slug');
        this.activeRoute.queryParams
            .subscribe(params => {
                this.duration = params.d ? parseInt(params.d) : 1;
                this.editItemIndex = params.i ? parseInt(params.i) : null;
                if (params.q) {
                    this.isEditProduct = true;
                    this.quantity = this.editItemQuantity = parseInt(params.q);
                }
            });
        this.getMainData();
        console.log(this.cart);
    }

    async getMainData() {
        let reviewsData = await this.getReviews(this.page);
        this.productsService.get(this.slug)
            .pipe(take(1))
            .pipe(finalize(() => {
                console.log(1111);

                this.isLoading = false;
                setTimeout(() => {
                    this.showSlides(this.slideIndex);
                }, 10);
            }))
            .subscribe(response => {
                this.product = response;
                this.product.reviewsData = reviewsData;
                console.log(this.product);

                this.price = this.getProductPrice(this.product);
                this.shopName = this.product.is_a_shop_listing == 1 ? ("(" + this.product.shop.name + ")") : "";
                this.wholesaleMinimumQuantity = Math.trunc(this.product.sellable_item?.wholesale_minimum_quantity);
                if (this.product.is_a_shop_listing) {
                    this.lat = parseFloat(this.product.shop.latitude);
                    this.lng = parseFloat(this.product.shop.longitude);
                } else {
                    this.lat = parseFloat(this.product.personal_listing.latitude);
                    this.lng = parseFloat(this.product.personal_listing.longitude);
                }
                this.images = this.product.files.length > 0 ? this.product.files : [this.product.shop.file];
                this.calculateRemainingQuantity();
                this.setNote();
            });
    }

    getProductPrice(product) {
        return (product.category_id == 1
            ? this.currencyPipe.transform(product.sellable_item.retail_price, '', '')
            : (this.currencyPipe.transform(product.rentable_item.price_per_month, '', '')));
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

    async getReviews(page) {
        let data = {
            page: page,
            per_page: this.pageSize
        }
        let reviewsData = await this.productsService.reviews(this.slug, data).toPromise();
        this.totalCount = reviewsData.total;
        if (this.product) {
            this.product.reviewsData = reviewsData;
        }
        return reviewsData;
    }

    setNote() {
        let item = { note: null };
        if (this.editItemIndex) {
            console.log(11);
            item = this.cart[this.editItemIndex];
        } else if (this.quantityAlreadyInCart && this.product.sellable_item) {
            console.log(22);
            item = this.cart.find((item) => {
                return item.id == this.product.id
            });
        }
        this.noteForAdmin = item.note;
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
        if (this.quantity > (this.product.quantity + this.editItemQuantity)) {
            Swal.fire(
                'No enough items available.',
                this.product.sellable_item
                    ? 'Please re-enter the quantity or contact the shop owner for more details.'
                    : 'Please contact the shop owner for more details.',
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
            'quantity': this.product.rentable_item ? 1 : (this.quantity + (this.isEditProduct ? 0 : this.quantityAlreadyInCart)),
            'duration': null,
            'note': this.noteForAdmin,
        };

        let product = this.product;
        if (product.rentable_item) {
            item.duration = this.duration;
            if (this.isEditProduct) {
                this.cart[this.editItemIndex] = item;
            } else {
                this.cart.push(item);
            }
            localStorage.setItem("cart", JSON.stringify(this.cart));
        } else { //sellable item
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

    changeActiveTab(tab) {
        this.activeTab = tab;
    }

    getStarWidth(rating) {
        return (rating * 16) + 'px';
    }
}
