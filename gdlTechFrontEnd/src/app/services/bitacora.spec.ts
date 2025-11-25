import { TestBed } from '@angular/core/testing';

import { Bitacora } from './bitacora';

describe('Bitacora', () => {
  let service: Bitacora;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bitacora);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
