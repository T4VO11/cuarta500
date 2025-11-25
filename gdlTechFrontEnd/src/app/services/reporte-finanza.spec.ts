import { TestBed } from '@angular/core/testing';

import { ReporteFinanza } from './reporte-finanza';

describe('ReporteFinanza', () => {
  let service: ReporteFinanza;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteFinanza);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
