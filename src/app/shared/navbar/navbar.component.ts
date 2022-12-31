import { Component, OnInit, ElementRef } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { updateCartCountService } from 'app/shared-services/update-cart-count.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
    private toggleButton: any;
    private sidebarVisible: boolean;
    isLoggedInUser: boolean = false;
    isAdmin: boolean = false;
    cartCount: number = 0;

    constructor(
        public location: Location,
        private element: ElementRef,
        private updateCartCountService: updateCartCountService,
    ) {
        this.sidebarVisible = false;
        if (localStorage.getItem('token')) {
            this.isLoggedInUser = true;
        }
        if (localStorage.getItem('is_admin') == "1") {
            this.isAdmin = true;
        }
    }

    ngOnInit() {
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
        window.location.href = "/";
    }

    openPath(path: string) {
        window.location.href = path;
    }
}
