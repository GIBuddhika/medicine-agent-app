import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { updateCartCountService } from 'app/shared-services/update-cart-count.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UserRolesConstants } from 'app/constants/user-roles';
import { AccountTypeConstants } from 'app/constants/account-types';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    onMobile: boolean;

    @HostListener('window:resize', ['onResize'])
    onResize(event) {
        if (window.innerWidth < 992) {
            this.onMobile = true;
        } else {
            this.onMobile = false;
        }
    }
    private toggleButton: any;

    accountType: number = 0;
    cartCount: number = 0;
    isLoggedInUser: boolean = false;
    isAccTypePersonal = AccountTypeConstants.PERSONAL;
    isAccTypeShop = AccountTypeConstants.SHOP;
    isAccTypeShopAndPersonal = AccountTypeConstants.SHOP_AND_PERSONAL;
    isAdmin: boolean = false;
    isCustomer: boolean = false;
    isShopAdmin: boolean = false;
    sidebarVisible: boolean;

    // activeMenu
    activeMenu: string = "";

    constructor(
        public location: Location,
        private element: ElementRef,
        private updateCartCountService: updateCartCountService,
        private router: Router,
    ) {
        router.events.filter(event => event instanceof NavigationEnd)
            .subscribe(event => {
                this.hightlightMenuItem();
            });
        this.sidebarVisible = false;
        if (localStorage.getItem('token')) {
            this.isLoggedInUser = true;
        }
        if (localStorage.getItem('user_role') == UserRolesConstants.ADMIN.toString()) {
            this.isAdmin = true;
        } else if (localStorage.getItem('user_role') == UserRolesConstants.SHOP_ADMIN.toString()) {
            this.isShopAdmin = true;
        } else if (localStorage.getItem('user_role') == UserRolesConstants.CUSTOMER.toString()) {
            this.isCustomer = true;
        }
        this.accountType = parseInt(localStorage.getItem('account_type'));
    }

    ngOnInit() {
        if (window.innerWidth < 992) {
            this.onMobile = true;
        } else {
            this.onMobile = false;
        }
        const navbar: HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
        this.cartCount = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')).length : 0;
        this.updateCartCountService.updateCartCountData.subscribe(response => {
            this.cartCount = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')).length : 0;
        });
    }
    sidebarOpen() {
        const toggleButton = this.toggleButton;
        const html = document.getElementsByTagName('html')[0];

        setTimeout(function () {
            toggleButton.classList.add('toggled');
        }, 500);
        html.classList.add('nav-open');

        this.sidebarVisible = true;
    };
    sidebarClose() {
        const html = document.getElementsByTagName('html')[0];
        // console.log(html);
        this.toggleButton.classList.remove('toggled');
        this.sidebarVisible = false;
        html.classList.remove('nav-open');
    };
    sidebarToggle() {
        // const toggleButton = this.toggleButton;
        // const body = document.getElementsByTagName('body')[0];
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
        } else {
            this.sidebarClose();
        }
    };
    isHome() {
        var titlee = this.location.prepareExternalUrl(this.location.path());
        if (titlee.charAt(0) === '#') {
            titlee = titlee.slice(1);
        }
        if (titlee === '/home') {
            return true;
        }
        else {
            return false;
        }
    }
    isDocumentation() {
        var titlee = this.location.prepareExternalUrl(this.location.path());
        if (titlee.charAt(0) === '#') {
            titlee = titlee.slice(1);
        }
        if (titlee === '/documentation') {
            return true;
        }
        else {
            return false;
        }
    }
    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("is_admin");
        localStorage.removeItem("is_shop_admin");
        window.location.href = "/";
    }

    openPath(path: string) {
        window.location.href = path;
    }

    hightlightMenuItem() {
        let url = location.pathname;
        this.activeMenu = "";

        switch (url) {
            case '/my-orders':
                this.activeMenu = "customer-orders";
                break;
            case '/admin/orders':
                this.activeMenu = "admin-orders";
                break;
            case '/admin/shops':
                this.activeMenu = "admin-shops";
                break;
            case '/admin/products':
                this.activeMenu = "admin-products";
                break;
            case '/admin/shop-admins':
                this.activeMenu = "admin-shop-admins";
                break;
            case '/admin/account-summary':
            case '/profile':
                this.activeMenu = "my-account";
                break;
            case '/cart':
                this.activeMenu = "cart";
                break;
            default:
                break;
        }
    }
}
