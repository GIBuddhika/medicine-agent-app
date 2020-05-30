import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';

import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

import { ComponentsModule } from './components/components.module';
import { SignupComponent } from './components/Auth/signup/signup.component';
import { RuntimeEnvLoaderService } from './services/runtime-env-loader.service';
import { HttpClientModule } from '@angular/common/http';

import { SpinnerButtonDirective } from './directives/spinner-button/spinner-button.directive';
import { LoginComponent } from './components/Auth/login/login.component';

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
    ...DIRECTIVES,
  ],
  imports: [
    BrowserModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ComponentsModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  exports: [...DIRECTIVES],
  providers: [
    RuntimeEnvLoaderService,
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
