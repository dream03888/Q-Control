import { NgModule } from "@angular/core";
import { QueueComponent } from "./Pages/queue/queue.component";
import { LayoutsRoutingModule } from "./layouts-routing.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "./components/navbar/navbar.component";
import { BottomBarComponent } from "./components/bottom-bar/bottom-bar.component";
import { DashboardStatusComponent } from './Pages/dashboard-status/dashboard-status.component';
import { DashboardQueueComponent } from './Pages/dashboard-queue/dashboard-queue.component';
import { ReportComponent } from './Pages/report/report.component';




@NgModule({
  declarations: [
   
    QueueComponent,
         DashboardStatusComponent,
         DashboardQueueComponent,
         ReportComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutsRoutingModule
  
  ],
  exports: [
    QueueComponent
  ]
})
export class LayoutsModule { }