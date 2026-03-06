import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) { }

  async getLoginUrl() {
    return this.http.get('http://localhost:3000/login') as Observable<{url: string}>
  }
}
