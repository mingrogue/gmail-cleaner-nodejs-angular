import { EventEmitter, NgModule, Output } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GetTokenComponent} from './components/get-token/get-token.component'

const routes: Routes = [
{
    path:'token/:params',
    component: GetTokenComponent,
    // pathMatch:"prefix"
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
  @Output() loggedIn:EventEmitter<boolean> = new EventEmitter<boolean>()

}
