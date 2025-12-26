import { Component } from '@angular/core';
interface App {
  type: string
  img: string;
  name: string;
  path: string;
}
@Component({
  selector: 'app-bottom-bar',
  standalone: false,
  templateUrl: './bottom-bar.component.html',
  styleUrl: './bottom-bar.component.css'
})
export class BottomBarComponent {
 isSelectAppVisible: boolean = false;
  isCarAlertVisible: boolean = false;
  isPassAlertVisible: boolean = false;
  isAnimating: boolean = false;
  isAnimatingSelect: boolean = false;

  appsSelect: App[] = [
    { 
      type: "routing",
      img: 'assets/icon/user.svg', 
      name: 'Profile', 
      path: '/profile' 
    },
    { 
      type: "routing", 
      img: "assets/icon/leave.svg", 
      name: 'Leave',
      path: "/leave-form"
    },
    
  ];

  appShow: App[] = [];

  ngOnInit() {
    this.loadAppShow();
  }

  toggleAppSelection(app: App) {
    const index = this.appShow.findIndex((item) => item.name === app.name);
    if (index === -1) {
      this.appShow.push(app);
    } else {
      this.appShow.splice(index, 1);
    }
    this.saveAppShow();
  }

  isSelected(app: App): boolean {
    return this.appShow.some((item) => item.name === app.name);
  }

  saveAppShow() {
    localStorage.setItem('appShow', JSON.stringify(this.appShow));
  }

  loadAppShow() {
    const data = localStorage.getItem('appShow');
    if (data) {
      this.appShow = JSON.parse(data);
    }
  }

  toggleAlert(): void {
    if (this.isSelectAppVisible) {
      this.closeDeleteAlert();
    } else {
      this.isSelectAppVisible = true;
      this.isAnimating = false;
    }
  }

  onAppClick(app: any, event: MouseEvent): void {
    if (app.name === 'Car Request') {
      this.isCarAlertVisible = true;
      this.isAnimating = false;   
    }

    if (app.name === 'Employee Pass') {
      this.isPassAlertVisible = true;
      this.isAnimating = false;
    }
  }

  closeDeleteAlert(): void {
    this.isSelectAppVisible = false;
    this.isAnimatingSelect = true;
    setTimeout(() => {
      this.isAnimatingSelect = false;
    }, 300);
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
}
