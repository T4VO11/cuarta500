import { TestBed } from '@angular/core/testing';

import { Incidente } from './incidente';

describe('Incidente', () => {
  let service: Incidente;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Incidente);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
