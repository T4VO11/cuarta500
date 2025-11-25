import { TestBed } from '@angular/core/testing';

import { Amenidad } from './amenidad';

describe('Amenidad', () => {
  let service: Amenidad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Amenidad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
