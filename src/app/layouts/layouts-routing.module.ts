import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { QueueComponent } from "./Pages/queue/queue.component";
import { DashboardStatusComponent } from "./Pages/dashboard-status/dashboard-status.component";
import { DashboardQueueComponent } from "./Pages/dashboard-queue/dashboard-queue.component";



const routes: Routes = [
  { path: '', redirectTo: 'queueu', pathMatch: 'full' },

    { path: 'queueu', component: QueueComponent },
    { path: 'dashboard-status', component: DashboardStatusComponent },
    { path: 'dashboard-queue', component: DashboardQueueComponent },


  






];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutsRoutingModule { }