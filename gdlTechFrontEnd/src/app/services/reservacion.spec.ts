import { TestBed } from '@angular/core/testing';

import { Reservacion } from './reservacion';

describe('Reservacion', () => {
  let service: Reservacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reservacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
