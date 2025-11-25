import { TestBed } from '@angular/core/testing';

import { ListadoAdeudo } from './listado-adeudo';

describe('ListadoAdeudo', () => {
  let service: ListadoAdeudo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListadoAdeudo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
