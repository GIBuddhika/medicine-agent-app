import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyShopsComponent } from './shops.component';

describe('MyShopsComponent', () => {
  let component: MyShopsComponent;
  let fixture: ComponentFixture<MyShopsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MyShopsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyShopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
