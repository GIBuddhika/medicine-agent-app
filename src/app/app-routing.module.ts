import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateAccountComponent } from './pages/create-account/create-account.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';

const routes: Routes = [
  { path: 'create-account', component: CreateAccountComponent },
  { path: 'sign-in', component: SignInComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
