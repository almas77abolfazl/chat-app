import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { VerifyCodeComponent } from './auth/verify-code/verify-code.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verify-code', component: VerifyCodeComponent },
  { path: '**', redirectTo: '/login' }
];
