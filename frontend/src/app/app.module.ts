import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { LoginService } from './services/login.service';
import {provideHttpClient} from '@angular/common/http';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { GetTokenComponent } from './components/get-token/get-token.component';
import { LoginComponent } from './components/login/login.component';
import { EmailService } from './services/email.service';

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import { GridModule } from "@progress/kendo-angular-grid";
import { ButtonsModule } from "@progress/kendo-angular-buttons";
import { InputsModule } from "@progress/kendo-angular-inputs";
import { ProfileComponent } from './components/profile/profile.component';
// import { EmailComponent } from './components/email/email.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GetTokenComponent,
    LoginComponent,
    ProfileComponent,
    // EmailComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    GridModule,
    ButtonsModule,
    InputsModule
  ],
  providers: [LoginService, provideHttpClient(), EmailService, ],
  bootstrap: [AppComponent]
})
export class AppModule { }
