import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { ComponentsComponent } from './components/components.component';
import { ProfileComponent } from './examples/profile/profile.component';
import { LandingComponent } from './examples/landing/landing.component';
import { NucleoiconsComponent } from './components/nucleoicons/nucleoicons.component';
import { SignupComponent } from './components/Auth/signup/signup.component';
import { LoginComponent } from './components/Auth/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { MyShopsComponent } from './components/my-shops/my-shops.component';
import { MyProductsComponent } from './components/my-products/my-products.component';
import { ProductComponent } from './components/product/product.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'my-shops', component: MyShopsComponent },
  { path: 'my-products', component: MyProductsComponent },
  { path: 'products/:slug', component: ProductComponent },

  { path: 'home', component: ComponentsComponent },
  { path: 'user-profile', component: ProfileComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'nucleoicons', component: NucleoiconsComponent }
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
