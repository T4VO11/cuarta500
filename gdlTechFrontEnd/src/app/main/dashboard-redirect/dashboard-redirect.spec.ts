import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRedirect } from './dashboard-redirect';

describe('DashboardRedirect', () => {
  let component: DashboardRedirect;
  let fixture: ComponentFixture<DashboardRedirect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRedirect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRedirect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
