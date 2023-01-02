import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopAdminsComponent } from './shop-admins.component';

describe('ShopAdminsComponent', () => {
  let component: ShopAdminsComponent;
  let fixture: ComponentFixture<ShopAdminsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShopAdminsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShopAdminsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
