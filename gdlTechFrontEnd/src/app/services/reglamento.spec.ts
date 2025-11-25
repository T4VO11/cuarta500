import { TestBed } from '@angular/core/testing';

import { Reglamento } from './reglamento';

describe('Reglamento', () => {
  let service: Reglamento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reglamento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
