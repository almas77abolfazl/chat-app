import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { VerifyCodeComponent } from './auth/verify-code/verify-code.component';
import { HomeComponent } from './main/home/home.component';
import { FillNamesComponent } from './auth/fill-names/fill-names.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verify-code', component: VerifyCodeComponent },
  { path: 'fill-names', component: FillNamesComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '/login' },
];
