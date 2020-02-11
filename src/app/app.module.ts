import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { SpinnerButtonDirective } from './directives/spinner-button/spinner-button.directive';
import { RuntimeEnvLoaderService } from './services/runtime-env-loader.service';

import { CreateAccountComponent } from './pages/create-account/create-account.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';

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
    ...DIRECTIVES,
    CreateAccountComponent,
    SignInComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(
      {
        closeButton: true
      }
    )
  ],
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
