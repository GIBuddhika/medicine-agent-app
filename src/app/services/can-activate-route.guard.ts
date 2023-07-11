import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserRolesConstants } from 'app/constants/user-roles';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { getLocaleMonthNames } from '@angular/common';

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
            this.router.navigate(['/']);
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
            if (roles.find(role => role == localStorage.getItem('user_role'))) {
                return true;
            } else {
                this.router.navigate(['not-found']);
            }
        } else {
            this.router.navigate(['/']);
        }
    }
}
