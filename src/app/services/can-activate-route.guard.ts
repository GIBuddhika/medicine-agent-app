import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
    providedIn: 'root'
})

export class CanActivateRouteGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
        : Observable<boolean> | Promise<boolean> | boolean {
        if (!localStorage.getItem('token')) {
            if (window.location.href.includes("/admin")) {
                this.router.navigate(['/admin/login'], { queryParams: { 'redirect': window.location.href } });
                return false;
            }
            this.router.navigate(['/']);
            return false;
        }

        let blockedAccountTypes = route.data.blockedAccountTypes as Array<string>;

        if (blockedAccountTypes) {
            let accountType = localStorage.getItem("account_type");
            if (blockedAccountTypes.find(account => account == accountType)) {
                this.router.navigate(['not-found']);
            }
        }

        let roles = route.data.roles as Array<string>;

        let isValid = this.authService.validate(localStorage.getItem('token'), localStorage.getItem('user_role'));

        if (isValid) {
            if (roles.find(role => role == localStorage.getItem('user_role')) == undefined) {
                this.router.navigate(['not-found']);
            } else {
                return true;
            }
        }
    }
}
