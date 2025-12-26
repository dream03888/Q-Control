import { Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutsComponent } from './layouts/layouts.component';
import { environment } from '../environments/environment.development';
import { Socket } from 'ngx-socket-io';
import { RouterModule } from '@angular/router';
import { QueueComponent } from './layouts/Pages/queue/queue.component';
import { BottomBarComponent } from './layouts/components/bottom-bar/bottom-bar.component';
import { NavbarComponent } from './layouts/components/navbar/navbar.component';
import { HttpClientModule } from '@angular/common/http';   // ✅

@Injectable()
export class SocketSupply extends Socket {
  constructor() {
    super({ url: environment.socketEndpoint, options: { autoConnect: true } });
  }
}

@NgModule({
  declarations: [
    AppComponent,
    LayoutsComponent,
    BottomBarComponent,
    NavbarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HttpClientModule
  ],
  providers: [SocketSupply],
  bootstrap: [AppComponent]
})
export class AppModule { }
