import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { ComponentsComponent } from './components/components.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LandingComponent } from './examples/landing/landing.component';
import { NucleoiconsComponent } from './components/nucleoicons/nucleoicons.component';
import { SignupComponent } from './components/Auth/signup/signup.component';
import { LoginComponent } from './components/Auth/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { ProductComponent } from './components/product/product.component';
import { MyProductsComponent } from './components/admin/my-products/my-products.component';
import { MyShopsComponent } from './components/admin/my-shops/my-shops.component';
import { CartComponent } from './components/cart/cart.component';
import { CanActivateRouteGuard } from './services/can-activate-route.guard';
import { PasswordResetRequestComponent } from './components/Auth/password-reset-request/password-reset-request.component';
import { AdminLoginComponent } from './components/Auth/admin-login/admin-login.component';
import { AdminSignupComponent } from './components/Auth/admin-signup/admin-signup.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ResetPasswordComponent } from './components/Auth/reset-password/reset-password.component';
import { AdminPasswordResetRequestComponent } from './components/Auth/admin-password-reset-request/admin-password-reset-request.component';
import { AdminResetPasswordComponent } from './components/Auth/admin-reset-password/admin-reset-password.component';
import { ShopAdminsComponent } from './components/admin/shop-admins/shop-admins.component';
import { UserRolesConstants } from './constants/user-roles';
import { MyOrdersComponent } from './components/my-orders/my-orders.component';
import { MyOrdersComponent as AdminOrdersComponent } from './components/admin/my-orders/my-orders.component';
import { AccountTypeConstants } from './constants/account-types';
import { AccountSummaryComponent } from './components/admin/account-summary/account-summary.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'password-reset-request', component: PasswordResetRequestComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'not-found', component: NotFoundComponent },

  {
    path: 'admin',
    children: [
      { path: 'login', component: AdminLoginComponent },
      { path: 'signup', component: AdminSignupComponent },
      { path: 'password-reset-request', component: AdminPasswordResetRequestComponent },
      { path: 'reset-password', component: AdminResetPasswordComponent },
    ]
  },

  {
    path: 'admin',
    children: [
      { path: 'shops', component: MyShopsComponent, canActivate: [CanActivateRouteGuard], data: { blockedAccountTypes: [AccountTypeConstants.PERSONAL] } },
      { path: 'products', component: MyProductsComponent, canActivate: [CanActivateRouteGuard] },
      { path: 'orders', component: AdminOrdersComponent, canActivate: [CanActivateRouteGuard] },
      { path: 'account-summary', component: AccountSummaryComponent, canActivate: [CanActivateRouteGuard] },
    ],
    data: { roles: [UserRolesConstants.ADMIN, UserRolesConstants.SHOP_ADMIN] }
  },

  {
    path: 'admin',
    children: [
      { path: 'shop-admins', component: ShopAdminsComponent, canActivate: [CanActivateRouteGuard], data: { blockedAccountTypes: [AccountTypeConstants.PERSONAL] } },
    ],
    data: { roles: [UserRolesConstants.ADMIN] }
  },

  { path: 'products/:slug', component: ProductComponent },
  { path: 'shops/:slug', component: ProductComponent },
  { path: 'cart', component: CartComponent },
  { path: 'my-orders', component: MyOrdersComponent },

  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [CanActivateRouteGuard], data: { roles: [UserRolesConstants.CUSTOMER, UserRolesConstants.ADMIN, UserRolesConstants.SHOP_ADMIN] } },

  { path: 'landing', component: LandingComponent },
  { path: 'icons', component: NucleoiconsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  exports: [
  ],
})
export class AppRoutingModule { }
