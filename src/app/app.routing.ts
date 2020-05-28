import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { ComponentsComponent } from './components/components.component';
import { ProfileComponent } from './examples/profile/profile.component';
import { LandingComponent } from './examples/landing/landing.component';
import { NucleoiconsComponent } from './components/nucleoicons/nucleoicons.component';
import { SignupComponent } from './components/Auth/signup/signup.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },

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
