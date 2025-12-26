import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardQueueComponent } from './dashboard-queue.component';

describe('DashboardQueueComponent', () => {
  let component: DashboardQueueComponent;
  let fixture: ComponentFixture<DashboardQueueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardQueueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
