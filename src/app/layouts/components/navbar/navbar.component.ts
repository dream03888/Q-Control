import { Component, ElementRef, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
    userRole!: string
menuActive = false;
  isCarAlertVisible: boolean = false;
  isAnimating: boolean = false;
  isPassAlertVisible: boolean = false;
  showModal: boolean = false;
  constructor(private elementRef: ElementRef, 
    private router: Router,
    ) {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.menuActive = false;
      }
    });

      //   this.activeRoute()
      //   if(!this.storageSrv.getLocalStorage('auth')){
      //   this.router.navigate(['/login'])
      // }
    //   this.loggedInUser = this.storageSrv.getLocalStorage('auth');
    // this.userRole = this.permissionSrv.getUserRole()
    // this.activeRoute()
    // console.log("USER",this.loggedInUser)

  }
  // activeRoute() {

  //   if(this.permissionSrv.isAdmin() && this.userRole === 'Admin'){ 
  //   }
  //   if(this.permissionSrv.isAdmin() && this.userRole === 'Admin'){ 
  //   }

  // }


  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.menuActive && 
        !this.elementRef.nativeElement.querySelector('.hamberger').contains(event.target as Node) && 
        !this.elementRef.nativeElement.querySelector('.menu').contains(event.target as Node)) {
      this.menuActive = false;
    }
  }

  showCarAlert() {
    this.isCarAlertVisible = true;
    this.isAnimating = false;
  }

  showPassAlert() {
    this.isPassAlertVisible = true;
    this.isAnimating = false;
  }

  closePassAlert(): void {
    this.isPassAlertVisible = false;
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, 300); 
  }

  closeCarAlert(): void {
    this.isCarAlertVisible = false;
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, 300); 
  }

  workTime(){
    this.showModal = true;
    console.log("work") 
  }
 async logout() {
  // console.log("logout123456")
    // const params = btoa('logout')
    // const route = `/validate/${params}`
    // this.router.navigate([route])
    // this.authSrv.logout();
  }

  getImageSrc(base64: string): string {
  if (!base64) return './assets/images/icon.png';

  if (base64.startsWith('/9j/')) {
    return 'data:image/jpeg;base64,' + base64;
  } else if (base64.startsWith('iVBORw0KG')) {
    return 'data:image/png;base64,' + base64;
  } else {
    return 'data:image/jpeg;base64,' + base64; // default
  }
}
  
}
