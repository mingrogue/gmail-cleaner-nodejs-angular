import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { check } from '../../../environments/environments';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private loginService: LoginService,
      // public window : Window
    ){

  }
  title = 'frontend';
  private loginUrl = ''
  loggedIn = true

  getLoggedInStatus () {
    console.log(check.loggedIn)
    return check.loggedIn
  }

  async onLoginOrSignup (){
    const urlResp =  await this.loginService.getLoginUrl()
    urlResp.subscribe(data => {
      console.log(data);
      this.loginUrl = data.url
      
      const window = getWindow()
      window.location.href = this.loginUrl
    })
    if(urlResp)this.loggedIn = false
    console.log(this.loggedIn);
    
  }

  
}

function getWindow (): Window {
    return window;
}

