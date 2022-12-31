import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPasswordResetRequestComponent } from './admin-password-reset-request.component';

describe('AdminPasswordResetRequestComponent', () => {
  let component: AdminPasswordResetRequestComponent;
  let fixture: ComponentFixture<AdminPasswordResetRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPasswordResetRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPasswordResetRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
