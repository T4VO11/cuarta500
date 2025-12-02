import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cancelado } from './cancelado';

describe('Cancelado', () => {
  let component: Cancelado;
  let fixture: ComponentFixture<Cancelado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cancelado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cancelado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
