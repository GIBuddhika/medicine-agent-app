import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';
import { AgmCoreModule, GoogleMapsAPIWrapper } from '@agm/core';
import { ImageCropperModule } from 'ngx-image-cropper';

import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

import { ComponentsModule } from './components/components.module';
import { SignupComponent } from './components/Auth/signup/signup.component';
import { RuntimeEnvLoaderService } from './services/runtime-env-loader.service';
import { HttpClientModule } from '@angular/common/http';

import { SpinnerButtonDirective } from './directives/spinner-button/spinner-button.directive';
import { LoginComponent } from './components/Auth/login/login.component';
import { MyShopsComponent } from './components/admin/my-shops/my-shops.component';
import { MyProductsComponent } from './components/admin/my-products/my-products.component';
import { HomeComponent } from './components/home/home.component';
import { ProductComponent } from './components/product/product.component';
import { CartComponent } from './components/cart/cart.component';
import { CommonModule, CurrencyPipe } from '@angular/common';

import { CanActivateRouteGuard } from './services/can-activate-route.guard';
import { PasswordResetRequestComponent } from './components/Auth/password-reset-request/password-reset-request.component';
import { AdminLoginComponent } from './components/Auth/admin-login/admin-login.component';
import { AdminSignupComponent } from './components/Auth/admin-signup/admin-signup.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ResetPasswordComponent } from './components/Auth/reset-password/reset-password.component';
import { AdminPasswordResetRequestComponent } from './components/Auth/admin-password-reset-request/admin-password-reset-request.component';
import { AdminResetPasswordComponent } from './components/Auth/admin-reset-password/admin-reset-password.component';
import { ShopAdminsComponent } from './components/admin/shop-admins/shop-admins.component';

const appInitializerFn = (envLoader: RuntimeEnvLoaderService) => {
  return () => {
    return envLoader.loadAppConfig();
  };
};

const DIRECTIVES = [
  SpinnerButtonDirective,
];

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    SignupComponent,
    LoginComponent,
    MyShopsComponent,
    MyProductsComponent,
    HomeComponent,
    ProductComponent,
    ...DIRECTIVES,
    CartComponent,
    PasswordResetRequestComponent,
    AdminLoginComponent,
    AdminSignupComponent,
    NotFoundComponent,
    ResetPasswordComponent,
    AdminPasswordResetRequestComponent,
    AdminResetPasswordComponent,
    ShopAdminsComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ComponentsModule,
    AppRoutingModule,
    HttpClientModule,
    ImageCropperModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyD7MA9r-hE1xk2ddbASxB17DYAllSOOeYY',
      libraries: ['places']
    }),
  ],
  exports: [...DIRECTIVES],
  providers: [
    RuntimeEnvLoaderService,
    GoogleMapsAPIWrapper,
    CurrencyPipe,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [RuntimeEnvLoaderService]
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
