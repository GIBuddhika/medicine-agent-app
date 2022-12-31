import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
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
            this.router.navigate(['/']);
        }

        let roles = route.data.roles as Array<string>;
        console.log(roles);


        let isValid = this.authService.validate(localStorage.getItem('token'), localStorage.getItem('is_admin'));

        if (isValid) {
            if (roles.find(role => role == 'admin')) {
                if (localStorage.getItem('is_admin') == "1") {
                    return true;
                } else {
                    this.router.navigate(['not-found']);
                }
            }
            else if (roles.find(role => role == 'customer')) {
                if (localStorage.getItem('is_admin') == "0") {
                    return true;
                } else {
                    this.router.navigate(['not-found']);
                }
            }
            return true;
        } else {
            this.router.navigate(['/']);
        }
    }
}
