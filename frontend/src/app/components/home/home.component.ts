import { ChangeDetectionStrategy, Component, ViewContainerRef, TemplateRef, ViewChild } from '@angular/core';
import { EmailService } from '../../services/email.service';
import { HttpClient } from '@angular/common/http';
import { interval, tap } from 'rxjs';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  constructor(private emailService: EmailService){}
  @ViewChild('outlet', { read: ViewContainerRef }) outletRef: ViewContainerRef;
  @ViewChild('content', { read: TemplateRef }) contentRef: TemplateRef<any>;

  @ViewChild('outlet1', { read: ViewContainerRef }) outletRef1: ViewContainerRef;
  @ViewChild('content1', { read: TemplateRef }) contentRef1: TemplateRef<any>;


  @ViewChild('outlet2', { read: ViewContainerRef }) outletRef2: ViewContainerRef;
  @ViewChild('content2', { read: TemplateRef }) contentRef2: TemplateRef<any>;
  
  cannotSendEmptyEmailArray: boolean = false

  public rerender() {
    this.outletRef.clear();
    this.outletRef.createEmbeddedView(this.contentRef);
  }

  public rerender1(){
    this.outletRef1.clear();
    this.outletRef1.createEmbeddedView(this.contentRef1);
  }


  public rerender2() {
    this.outletRef2.clear();
    this.outletRef2.createEmbeddedView(this.contentRef2);
  }

  public selectedEmails = ''
  public name = ''
  public picture = ''
  public email = ''
  public render = false
  public totalDeleted = 0
  public inputValue: string = ''
  public display = 'Enter the email ids, or the domain names you want to be delete form your gmail. For example you have an email from - contest@techgig.com. Here you just give techgig.com and we will regex match the email and delete it. Please give comma seperated texts.'
  onChange(val: any){
    console.log(val, 'val');    
  }
  deleteEmails(){
    const emailArray = this.inputValue.split(',').map(email=> email.toLowerCase())

    if(emailArray.length === 0) this.cannotSendEmptyEmailArray = true
    else{
      console.log(localStorage.getItem('access_token'), localStorage.getItem('sub'));
      this.emailService.deleteEmails('Bearer '+localStorage.getItem('access_token') as string, localStorage.getItem('email') as string, emailArray).subscribe(resp=>console.log(resp))
      this.fetchTotalDeletedOnIntervals()
    }
  }
  async getTotalDeletedEmails(){
    const resp = await this.emailService.totalDeleted(localStorage.getItem('access_token') as string, localStorage.getItem('email') as string)
    resp.subscribe(data=> this.totalDeleted = data as number)
  }

  async fetchTotalDeletedOnIntervals(){
    const obs$ = interval(30000)
    obs$.subscribe((d) => {
      this.emailService.totalDeleted(localStorage.getItem('access_token') as string, localStorage.getItem('email') as string).subscribe(resp=>{
        this.totalDeleted = resp
        console.log(this.totalDeleted, 'total deleted');
        this.rerender1()
      })
    })
  }

  ngOnInit(){
    this.emailService.totalDeleted(localStorage.getItem('access_token') as string, localStorage.getItem('email') as string).subscribe(resp=>{
      this.totalDeleted = resp
      console.log(this.totalDeleted, 'total deleted');
      this.rerender1()
    })
    this.emailService.getProfile(localStorage.getItem('access_token') as string, localStorage.getItem('email') as string).then(
      resp => {
        // console.log(resp, 'resp');
        resp.subscribe(data => {
        this.name = data.name
        this.picture = data.picture
        this.email = data.email
        this.selectedEmails = data.emailList.join(',')
        this.rerender2()
        console.log(this.name, 'subscribe')
        this.render = true
        console.log(this.render, 'render');
        this.rerender()
      })
    })
  }

  renderProfile(){
    console.log('render profile', this.render);
    return this.render
  }
}
