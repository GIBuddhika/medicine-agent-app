import { Component, OnInit, Inject, Renderer2, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/filter';
import { DOCUMENT } from '@angular/common';
import { LocationStrategy, PlatformLocation, Location } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { UpdateMainViewSharedService } from './shared-services/update-main-view.service';
import { MetaService } from './services/meta.service';
import { stringify } from 'querystring';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    private _router: Subscription;
    showHeader: boolean = true;
    showFooter: boolean = true;

    @ViewChild(NavbarComponent) navbar: NavbarComponent;

    @HostListener("window:scroll", ["$event"])
    onWindowScroll() {
        let pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
        let max = document.documentElement.scrollHeight;
        if (document.getElementById('navBarDiv')) {
            if (pos == max) {
                this.renderer.addClass(document.getElementById('navBarDiv'), "top");
            } else {
                this.renderer.removeClass(document.getElementById('navBarDiv'), "top");
            }
        }
    }

    constructor(
        private renderer: Renderer2,
        private router: Router,
        @Inject(DOCUMENT) private document: any,
        private element: ElementRef,
        public location: Location,
        private updateMainViewSharedService: UpdateMainViewSharedService,
        private metaService: MetaService,
    ) {
    }
    ngOnInit() {
        this.getMainData();
        this.showHeader = true;
        this.showFooter = true;
        this.updateMainViewSharedService.updateMainViewData.subscribe(response => {
            if (response == 'sign-up' || response == 'login' || response == 'password-reset-request') {
                this.showHeader = false;
            } else {
                this.showHeader = true;
            }
        });

        this._router = this.router.events.filter(event => event instanceof NavigationEnd).subscribe((event: NavigationEnd) => {
            if (window.outerWidth > 991) {
                window.document.children[0].scrollTop = 0;
            } else {
                window.document.activeElement.scrollTop = 0;
            }
        });

        var ua = window.navigator.userAgent;
        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            var version = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }
        if (version) {
            var body = document.getElementsByTagName('body')[0];
            body.classList.add('ie-background');

        }
    }
    removeFooter() {
        var titlee = this.location.prepareExternalUrl(this.location.path());
        titlee = titlee.slice(1);
        if (titlee === 'signup' || titlee === 'nucleoicons') {
            return false;
        }
        else {
            return true;
        }
    }

    getMainData() {
        if (localStorage.getItem('districts') === null) {
            this.metaService.getDistricts()
                .subscribe(response => {
                    var districts = [];
                    response.forEach(district => {
                        districts.push({ id: district.id, name: district.name });
                    });
                    localStorage.setItem("districts", JSON.stringify(districts));
                });
        }
    }
}
