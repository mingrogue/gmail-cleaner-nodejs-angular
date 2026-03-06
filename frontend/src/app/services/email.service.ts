import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) { }
  async getUniqueEmails(token: string, email: string, total: string){
    return this.http.get(`http://localhost:3000/email/get-email-ids?userId=${email}&total=${total}`, {headers:{Authorization:'Bearer '+token}})
  }

  deleteEmails(token: string, email: string, emails: string[]): Observable<any>{
    return this.http.post(`http://localhost:3000/email/delete?userId=${email}`, {emails}, {headers:{Authorization:token}})
  }

  totalDeleted(token: string, email: string): Observable<any>{
    return this.http.get(`http://localhost:3000/email/total-deleted?userId=${email}`, {headers:{Authorization:'Bearer '+token}})
  }

  async getProfile(token: string, email: string){
    return this.http.get(`http://localhost:3000/profile?email=${email}`, {headers:{Authorization:'Bearer '+token}})  as Observable<any>
  }
}
