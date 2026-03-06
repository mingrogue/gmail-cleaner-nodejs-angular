import { Component } from '@angular/core';
import { check } from '../../../environments/environments';
import { ActivatedRoute } from '@angular/router';
import {jwtDecode} from 'jwt-decode';

@Component({
  selector: 'app-get-token',
  templateUrl: './get-token.component.html',
  styleUrl: './get-token.component.scss'
})
export class GetTokenComponent {
  accessToken: string = ''
  name: string = ''
  email: string = ''
  picture: string= ''
  sub: string = ''
  constructor(private _route: ActivatedRoute){
    check.loggedIn = false
    _route.params.subscribe((params: any)=>{
      // if(!params){
      //   console.log('error in login');
      //   check.loggedIn = true
      // }
      
      this.accessToken = params.params?.split('&')[0]
      this.email = params.params?.split('&')[1]
      localStorage.setItem('access_token', this.accessToken)
      localStorage.setItem('email', this.email)
      console.log(params.params, this.accessToken, this.email);
      
    })
  }
}
